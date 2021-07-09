import type {
  GetStaticPathsContext,
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from 'next'
import { useRouter } from 'next/router'
import commerce from '@lib/api/commerce'
import { Layout } from '@components/common'
import { ProductView } from '@components/product'

let pagesResponse: any = null
async function fetchAllPages(config: any, preview: any) {
  if (pagesResponse !== null) {
    return pagesResponse
  }
  const _pagesResponse = await commerce.getAllPages({ config, preview })
  pagesResponse = _pagesResponse
  return pagesResponse
}

let siteInfoResponse: any = null
async function fetchSiteInfo(config: any, preview: any) {
  if (siteInfoResponse !== null) {
    return siteInfoResponse
  }
  const _siteInfoResponse = await commerce.getSiteInfo({ config, preview })
  siteInfoResponse = _siteInfoResponse
  return siteInfoResponse
}

let numberOfBuilds = 0;
let totalBuildTime = 0;
export async function getStaticProps({
  params,
  locale,
  locales,
  preview,
}: GetStaticPropsContext<{ slug: string }>) {
  console.time('buildTime')
  const startOfBuildTime = new Date().getTime();
  const config = { locale, locales }
  const pagesPromise = fetchAllPages(config, preview)
  const siteInfoPromise = fetchSiteInfo(config, preview)
  const productPromise = commerce.getProduct({
    variables: { slug: params!.slug },
    config,
    preview,
  })

  const allProductsPromise = commerce.getAllProducts({
    variables: { first: 4 },
    config,
    preview,
  })
  const [pagesResponse, categoriesResponse, productResponse, allProductsResponse] = await Promise.all([
    pagesPromise,
    siteInfoPromise,
    productPromise,
    allProductsPromise
  ])
  const { pages } = pagesResponse
  const { categories } = categoriesResponse
  const { product } = productResponse
  const { products: relatedProducts } = allProductsResponse

  if (!product) {
    throw new Error(`Product with slug '${params!.slug}' not found`)
  }

  console.log(`building: ${product.path}`)
  console.timeEnd('buildTime')
  totalBuildTime += new Date().getTime() - startOfBuildTime
  numberOfBuilds++;
  console.log('Average build time: ', totalBuildTime / numberOfBuilds)
  return {
    props: {
      pages,
      product,
      relatedProducts,
      categories,
    },
    revalidate: 200,
  }
}

export async function getStaticPaths({ locales }: GetStaticPathsContext) {
  const products: any[] = [];
  const pages = [...Array(61).keys()]
  for (const page of pages) {
    const { products: productsPaginated } = await commerce.getAllProductPaths({ variables: { first: 100, page } })
    console.log(`first product id: ${JSON.stringify(productsPaginated[0])}`)
    products.push(...productsPaginated);
  }

  console.log(`Number of products ${products.length}`)
  const paths = locales
      ? locales.reduce<string[]>((arr, locale) => {
          // Add a product path for every locale
          products.forEach((product: any) => {
            arr.push(`/${locale}/product${product.path}`)
          })
          return arr
        }, [])
      : products.map((product: any) => `/product${product.path}`)

      console.log(`Number of paths ${paths.length}`)
  return {
    paths: locales
      ? locales.reduce<string[]>((arr, locale) => {
          // Add a product path for every locale
          products.forEach((product: any) => {
            arr.push(`/${locale}/product${product.path}`)
          })
          return arr
        }, [])
      : products.map((product: any) => `/product${product.path}`),
    fallback: 'blocking',
  }
}

export default function Slug({
  product,
  relatedProducts,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter()

  return router.isFallback ? (
    <h1>Loading...</h1>
  ) : (
    <ProductView product={product} relatedProducts={relatedProducts} />
  )
}

Slug.Layout = Layout
