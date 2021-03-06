import type {
  GetStaticPathsContext,
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from 'next'
import { useRouter } from 'next/router'
import commerce from '@lib/api/commerce'
import { Layout } from '@components/common'
import { ProductView } from '@components/product'

const NUM_PAGES = 62;

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

let allProductsResponse: any = null
async function fetchRelatedProducts(config: any, preview: any) {
  if (allProductsResponse !== null) {
    return allProductsResponse
  }
  const _allProductsResponse = await commerce.getAllProducts({
    variables: { first: 4 },
    config,
    preview,
  })
  allProductsResponse = _allProductsResponse
  return allProductsResponse
}

let products: any = {}
let isFetching = false
async function fetchAllProducts() {
  if (isFetching || Object.keys(products).length > 0) {
    return null
  }
  isFetching = true
  const pages = [...Array(NUM_PAGES).keys()]
  for (const page of pages) {
    const { products: allProducts } = await commerce.getAllProducts({ variables: { first: 100, page } })
    for (const product of allProducts) {
      const index: string = product!.slug || 'a'
      products[index] = product
    }
  }
  isFetching = false
}

async function fetchProduct(slug: string, config: any, preview: any) {
  if (!isFetching) {
    fetchAllProducts()
  }

  if (isFetching) {
    const { product } = await commerce.getProduct({
      variables: { slug },
      config,
      preview,
    })
    return product
  }
  return products[slug]
}

let numberOfBuilds = 0;
let totalBuildTime = 0;
export async function getStaticProps({
  params,
  locale,
  locales,
  preview,
}: GetStaticPropsContext<{ slug: string }>) {
  console.time(`page ${params!.slug} build time`)
  const startOfBuildTime = new Date().getTime();
  const config = { locale, locales }

  const [pagesResponse, categoriesResponse, product, allProductsResponse] = await Promise.all([
    fetchAllPages(config, preview),
    fetchSiteInfo(config, preview),
    fetchProduct(params!.slug, config, preview),
    fetchRelatedProducts(config, preview)
  ])
  const { pages } = pagesResponse
  const { categories } = categoriesResponse
  const { products: relatedProducts } = allProductsResponse

  if (!product) {
    throw new Error(`Product with slug '${params!.slug}' not found`)
  }

  console.timeEnd(`page ${params!.slug} build time`)
  totalBuildTime += new Date().getTime() - startOfBuildTime
  numberOfBuilds++;
  // console.log('Average static page build time: ', totalBuildTime / numberOfBuilds)
  return {
    props: {
      pages,
      product,
      relatedProducts,
      categories,
    },
    // revalidate: 200,
  }
}

export async function getStaticPaths({ locales }: GetStaticPathsContext) {
  const products: any[] = [];
  const pages = [...Array(NUM_PAGES).keys()]
  for (const page of pages) {
    const { products: productsPaginated } = await commerce.getAllProductPaths({ variables: { first: 100, page } })
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
