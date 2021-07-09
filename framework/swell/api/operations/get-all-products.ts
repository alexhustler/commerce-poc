import { normalizeProduct } from '../../utils/normalize'
import { SwellProduct } from '../../types'
import { Product } from '@commerce/types/product'
import { Provider, SwellConfig } from '../'
import { OperationContext } from '@commerce/api/operations'

export type ProductVariables = { first?: number, page?: number }

export default function getAllProductsOperation({
  commerce,
}: OperationContext<Provider>) {
  async function getAllProducts(opts?: {
    variables?: ProductVariables
    config?: Partial<SwellConfig>
    preview?: boolean
  }): Promise<{ products: Product[] }>

  async function getAllProducts({
    config: cfg,
    variables = { first: 250, page: 0 },
  }: {
    query?: string
    variables?: ProductVariables
    config?: Partial<SwellConfig>
    preview?: boolean
  } = {}): Promise<{ products: Product[] | any[] }> {
    const config = commerce.getConfig(cfg)
    console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa: ', variables.page)
    const { results } = await config.fetch('products', 'list', [
      {
        limit: variables.first,
        page: variables.page
      },
    ])
    const products = results.map((product: SwellProduct) =>
      normalizeProduct(product)
    )

    return {
      products,
    }
  }

  return getAllProducts
}
