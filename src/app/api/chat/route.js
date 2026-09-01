import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Mensagem não informada' }, { status: 400 });
    }

    // Substitua SEU_IP_DA_VPS pelo IP público real da sua VPS
    const VPS_URL = 'https://chat.landz.re/chat';
    const SECRET_TOKEN = 'hsk_9f8d7c6b5a4e3210789fabcde';

    const vpsResponse = await fetch(VPS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SECRET_TOKEN}`
      },
      body: JSON.stringify({ message })
    });

    if (!vpsResponse.ok) {
      throw new Error(`Erro na comunicação com a VPS: ${vpsResponse.statusText}`);
    }

    const data = await vpsResponse.json();

    return NextResponse.json({ reply: data.reply });
  } catch (error) {
    console.error('Erro na API route do Chat Hermes:', error);
    return NextResponse.json({ error: 'Erro interno ao processar a mensagem.' }, { status: 500 });
  }
}