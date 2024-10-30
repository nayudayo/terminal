import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    // Simple echo response
    const response = {
      message: `Echo: ${message}`,
    };

    // Simulate network delay for typing effect
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message:'Internal Server Error' },
      { status: 500 }
    );
  }
}
