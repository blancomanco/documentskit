import { put, list, del } from '@vercel/blob';

const FILE_PATH = 'data/data.json';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const blobs = await list({ prefix: FILE_PATH });
      const file = blobs.blobs.find((b) => b.pathname === FILE_PATH);

      if (!file) {
        return res.status(200).json({ items: [] });
      }

      const response = await fetch(file.url);
      const json = await response.json();

      return res.status(200).json(json);
    }

    if (req.method === 'POST') {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      const blob = await put(FILE_PATH, JSON.stringify(body, null, 2), {
        access: 'public',
        allowOverwrite: true,
        contentType: 'application/json',
      });

      return res.status(200).json({ success: true, url: blob.url });
    }

    if (req.method === 'DELETE') {
      const blobs = await list({ prefix: FILE_PATH });
      const file = blobs.blobs.find((b) => b.pathname === FILE_PATH);

      if (!file) return res.status(404).json({ error: 'File not found' });

      await del(file.url);

      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message,
    });
  }
}
