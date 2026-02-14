export async function GET() {
  try {
    const response = await fetch('https://www.apicountries.com/countries', {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return new Response('Failed to load countries', { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch {
    return new Response('Failed to load countries', { status: 500 });
  }
}
