'use client';

import React from "react"

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatAPI, userAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Video } from 'lucide-react';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const socketRef = useRef<Socket | null>(null);

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
    mutationFn: () =>
      chatAPI.sendMessage(selectedChatId as string, message.trim(), attachments),
    onSuccess: () => {
      setMessage('');
      setAttachments([]);
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (socketRef.current) return;

    const baseUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/api\/v1\/?$/, '') ||
      window.location.origin;

    socketRef.current = io(baseUrl, {
      transports: ['websocket'],
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (socketRef.current && myUserId) {
      socketRef.current.emit('joinChatRoom', myUserId);
    }
  }, [myUserId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !myUserId) return;

    const handleCallRequest = (payload: any) => {
      const fromName = payload?.fromName || 'Caller';
      const callType = payload?.callType === 'video' ? 'video' : 'audio';
      const confirmCall = window.confirm(
        `${fromName} is calling (${callType}). Accept?`,
      );

      socket.emit(confirmCall ? 'call:answer' : 'call:reject', {
        ...payload,
        toUserId: payload?.fromUserId,
        fromUserId: myUserId,
      });
    };

    const handleCallAnswer = () => {
      toast.success('Call accepted. Start your WebRTC flow.');
    };

    const handleCallReject = () => {
      toast.error('Call rejected.');
    };

    const handleCallEnd = () => {
      toast('Call ended.');
    };

    socket.on('call:request', handleCallRequest);
    socket.on('call:answer', handleCallAnswer);
    socket.on('call:reject', handleCallReject);
    socket.on('call:end', handleCallEnd);

    return () => {
      socket.off('call:request', handleCallRequest);
      socket.off('call:answer', handleCallAnswer);
      socket.off('call:reject', handleCallReject);
      socket.off('call:end', handleCallEnd);
    };
  }, [myUserId]);

  const handleSend = () => {
    if (!selectedChatId) {
      toast.error('Select a customer to chat');
      return;
    }
    if (!message.trim() && attachments.length === 0) {
      return;
    }
    sendMessageMutation.mutate();
  };

  const handleCall = (callType: 'audio' | 'video') => {
    if (!activeChat?.user?._id) {
      toast.error('Select a customer to call');
      return;
    }
    if (!socketRef.current) {
      toast.error('Call connection not ready');
      return;
    }

    socketRef.current.emit('call:request', {
      chatId: activeChat._id,
      fromUserId: myUserId,
      fromName:
        profileData?.storeName || profileData?.name || profileData?.firstName || 'Seller',
      toUserId: activeChat.user._id,
      callType,
      createdAt: new Date().toISOString(),
    });

    toast.success(`${callType === 'audio' ? 'Audio' : 'Video'} call request sent`);
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const renderAttachment = (attachment: any) => {
    const mimeType = attachment?.mimeType || '';
    const url = attachment?.url;
    if (!url) return null;

    if (mimeType.startsWith('image/')) {
      return (
        <img
          src={url}
          alt={attachment?.fileName || 'Image'}
          className="max-h-48 w-auto rounded border"
        />
      );
    }

    if (mimeType.startsWith('video/')) {
      return (
        <video className="max-h-56 w-full rounded border" controls>
          <source src={url} type={mimeType} />
        </video>
      );
    }

    if (mimeType.startsWith('audio/')) {
      return (
        <audio className="w-full" controls>
          <source src={url} type={mimeType} />
        </audio>
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-amber-700 underline"
      >
        {attachment?.fileName || 'File attachment'}
      </a>
    );
  };

  const listItems = useMemo(() => {
    return chats.map((chat: any) => {
      const lastMessage =
        chat.messages?.[0]?.text ||
        (chat.messages?.[0]?.attachments?.length ? 'Attachment' : 'No messages yet');
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Chat</CardTitle>
                <CardDescription>
                  {activeChat
                    ? 'Conversation with customer'
                    : 'Select a customer to start chatting'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => handleCall('audio')}
                  disabled={!activeChat?.user?._id || sendMessageMutation.isPending}
                  title="Start audio call"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => handleCall('video')}
                  disabled={!activeChat?.user?._id || sendMessageMutation.isPending}
                  title="Start video call"
                >
                  <Video className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
                            {msg.text ? <p>{msg.text}</p> : null}
                            {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {msg.attachments.map((attachment: any, index: number) => (
                                  <div key={attachment.public_id || attachment.url || index}>
                                    {renderAttachment(attachment)}
                                  </div>
                                ))}
                              </div>
                            )}
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

                <div className="flex flex-col gap-2">
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                        >
                          <span className="max-w-[180px] truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-slate-500 hover:text-slate-700"
                            disabled={sendMessageMutation.isPending}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <label className="inline-flex items-center rounded border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:border-amber-300">
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                        onChange={handleFilesChange}
                        className="hidden"
                        disabled={sendMessageMutation.isPending}
                      />
                      Attach
                    </label>
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
