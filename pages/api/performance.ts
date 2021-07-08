export default async function handler(req: any, res: any) {
  const number = Math.random();
  res.json({ number })
}
