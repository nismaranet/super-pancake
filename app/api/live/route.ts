import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'No URL' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      cache: 'no-store',
    })

    const data = await res.json()

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: 'Fetch failed' },
      { status: 500 }
    )
  }
}
