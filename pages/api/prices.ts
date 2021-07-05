import commerce from '@lib/api/commerce'
export default async function handler(req: any, res: any) {
  try {
    const productResponse = await commerce.getProduct({
      variables: { slug: req.query.slug },
      config: {},
      preview: {},
    })
    const { price } = productResponse.product;
    res.json({ price })
  } catch (error) {
    res.status(404).send("item not found")
  }
}
