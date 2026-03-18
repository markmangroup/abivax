import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'outputs', 'ERP_Program_Encyclopedia.html');

  if (!fs.existsSync(filePath)) {
    return new NextResponse(
      '<h2 style="font-family:sans-serif;padding:40px">Encyclopedia not found. Run <code>node scripts/generate_encyclopedia_html.js</code> to generate it.</h2>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  const html = fs.readFileSync(filePath, 'utf-8');
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
