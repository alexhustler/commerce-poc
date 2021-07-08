import cn from 'classnames'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import s from './ProductView.module.css'
import { FC } from 'react'
import type { Product } from '@commerce/types/product'
import usePrice from '@framework/product/use-price'
import { WishlistButton } from '@components/wishlist'
import { ProductSlider, ProductCard } from '@components/product'
import { Container, Text } from '@components/ui'
import ProductSidebar from '../ProductSidebar'
import ProductTag from '../ProductTag'
import { resolve } from 'path'
interface ProductViewProps {
  product: Product
  relatedProducts: Product[]
}

async function fetchPrice(slug: string | undefined): Promise<{ value: number; currencyCode: string; }> {
  const url = "/api/prices?" + new URLSearchParams({
    slug: slug as string
  })
  const res = await fetch(url!)
  const { price } = await res.json()
  return price
}

const ProductView: FC<ProductViewProps> = ({ product, relatedProducts }) => {
  // const { price } = usePrice({
  //   amount: product.price.value,
  //   baseAmount: product.price.retailPrice,
  //   currencyCode: product.price.currencyCode!,
  // })

  const [price, setPrice] = useState<number | string>('')

  useEffect(() => {
    fetchPrice(product.slug)
      .then(_price => {
        setPrice(_price.value)
      })
    // test performance of serverless functions
    fetch(`/api/performance`)
      .then(() => {
        console.log('Finished performance check!')
      })
  }, [product])

  return (
    <>
      <Container className="max-w-none w-full" clean>
        <div className={cn(s.root, 'fit')}>
          <div className={cn(s.main, 'fit')}>

            <ProductTag
              name={product.name}
              price={`${price} ${product.price?.currencyCode}`}
              fontSize={32}
            />
            <div className={s.sliderContainer}>
              <ProductSlider key={product.id}>
                {product.images.map((image, i) => (
                  <div key={image.url} className={s.imageContainer}>
                    <Image
                      className={s.img}
                      src={image.url!}
                      alt={image.alt || 'Product Image'}
                      width={600}
                      height={600}
                      priority={i === 0}
                      quality="85"
                    />
                  </div>
                ))}
              </ProductSlider>
            </div>
            {process.env.COMMERCE_WISHLIST_ENABLED && (
              <WishlistButton
                className={s.wishlistButton}
                productId={product.id}
                variant={product.variants[0]}
              />
            )}
          </div>

          <ProductSidebar product={product} className={s.sidebar} />
        </div>
        <hr className="mt-7 border-accent-2" />
        <section className="py-12 px-6 mb-10">
          <Text variant="sectionHeading">Related Products</Text>
          <div className={s.relatedProductsGrid}>
            {relatedProducts.map((p) => (
              <div
                key={p.path}
                className="animated fadeIn bg-accent-0 border border-accent-2"
              >
                <ProductCard
                  noNameTag
                  product={p}
                  key={p.path}
                  variant="simple"
                  className="animated fadeIn"
                  imgProps={{
                    width: 300,
                    height: 300,
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      </Container>
      <NextSeo
        title={product.name}
        description={product.description}
        openGraph={{
          type: 'website',
          title: product.name,
          description: product.description,
          images: [
            {
              url: product.images[0]?.url!,
              width: 800,
              height: 600,
              alt: product.name,
            },
          ],
        }}
      />
    </>
  )
}

export default ProductView
