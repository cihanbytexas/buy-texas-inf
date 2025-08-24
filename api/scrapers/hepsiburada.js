const axios = require('axios')
const cheerio = require('cheerio')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'

function parsePrice(txt) {
  if (!txt) return 0
  // 12.345,67 TL veya 12.345 TL
  const clean = txt.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.')
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

module.exports = async function hepsiburada(query) {
  const url = `https://www.hepsiburada.com/ara?q=${encodeURIComponent(query)}`
  const { data } = await axios.get(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'tr-TR,tr;q=0.9' }, timeout: 15000 })
  const $ = cheerio.load(data)

  // hepsiburada kart seçicileri
  const card = $('[data-test-id=product-card], li.search-item, .product-list .productListContent-item').first()
  let title = card.find('[data-test-id=product-card-name], h3, h2').first().text().trim()
  let priceTxt =
    card.find('[data-test-id=price-current-price], .price-value, .price').first().text().trim()

  // bazı sayfalarda fiyat parçalara ayrılmış geliyor
  if (!priceTxt) {
    const whole = card.find('[data-test-id=price-whole]').text().trim()
    const frac = card.find('[data-test-id=price-fraction]').text().trim()
    if (whole) priceTxt = `${whole},${frac || '00'} TL`
  }

  let href = card.find('a[href]').attr('href') || ''
  const productUrl = href.startsWith('http') ? href : ('https://www.hepsiburada.com' + href)

  const priceNum = parsePrice(priceTxt)

  return {
    site: 'Hepsiburada',
    title: title || query,
    price: priceTxt || (priceNum ? `${priceNum} TL` : ''),
    priceNum,
    url: productUrl
  }
}
