'use client';

import React from "react"

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatAPI, userAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const { data: profileData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userAPI.getProfile(),
    select: (response) => response.data.data,
  });

  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ['my-customers'],
    queryFn: () => chatAPI.getMyCustomers(),
    select: (response) => response.data.data,
  });

  const chats = Array.isArray(chatsData) ? chatsData : [];

  const { data: selectedChatData, isLoading: chatLoading } = useQuery({
    queryKey: ['chat', selectedChatId],
    queryFn: () => chatAPI.getChatById(selectedChatId as string),
    select: (response) => response.data.data,
    enabled: !!selectedChatId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: () => chatAPI.sendMessage(selectedChatId as string, message.trim()),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['my-customers'] });
      queryClient.invalidateQueries({ queryKey: ['chat', selectedChatId] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to send message';
      toast.error(message);
    },
  });

  const activeChat = selectedChatData || null;
  const activeMessages = activeChat?.messages || [];
  const myUserId = profileData?._id;

  const handleSend = () => {
    if (!selectedChatId) {
      toast.error('Select a customer to chat');
      return;
    }
    if (!message.trim()) {
      return;
    }
    sendMessageMutation.mutate();
  };

  const listItems = useMemo(() => {
    return chats.map((chat: any) => {
      const lastMessage = chat.messages?.[0]?.text || 'No messages yet';
      const displayName =
        chat.user?.name ||
        chat.name ||
        [chat.user?.firstName, chat.user?.lastName].filter(Boolean).join(' ') ||
        'Customer';
      return {
        id: chat._id,
        name: displayName,
        lastMessage,
        updatedAt: chat.updatedAt,
      };
    });
  }, [chats]);

  useEffect(() => {
    if (!selectedChatId && listItems.length > 0) {
      setSelectedChatId(listItems[0].id);
    }
  }, [listItems, selectedChatId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-slate-500 mt-1">Dashboard &gt; Messages</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Your recent conversations</CardDescription>
          </CardHeader>
          <CardContent>
            {chatsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : listItems.length > 0 ? (
              <div className="space-y-2">
                {listItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedChatId(item.id)}
                    className={`w-full text-left border rounded-lg p-3 transition ${
                      selectedChatId === item.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-slate-500 truncate">{item.lastMessage}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">No customers yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Chat</CardTitle>
            <CardDescription>
              {activeChat ? 'Conversation with customer' : 'Select a customer to start chatting'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chatLoading && selectedChatId ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            ) : activeChat ? (
              <div className="flex flex-col gap-4">
                <div className="h-80 overflow-y-auto space-y-3 border rounded-lg p-4 bg-slate-50">
                  {activeMessages.length > 0 ? (
                    activeMessages.map((msg: any) => {
                      const isMe = msg.user?._id === myUserId;
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                              isMe
                                ? 'bg-amber-600 text-white'
                                : 'bg-white border text-slate-800'
                            }`}
                          >
                            <p>{msg.text}</p>
                            <p className={`mt-1 text-[10px] ${isMe ? 'text-amber-100' : 'text-slate-400'}`}>
                              {msg.date ? new Date(msg.date).toLocaleTimeString() : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500">No messages yet</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSend}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={sendMessageMutation.isPending}
                  >
                    {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500">
                Select a customer from the list to view messages.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
