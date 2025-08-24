const trendyol = require('./scrapers/trendyol')
const hepsiburada = require('./scrapers/hepsiburada')

module.exports = async (req, res) => {
  const q = (req.query.query || '').trim()
  if (!q) return res.status(400).json({ error: 'query param zorunlu ör: ?query=iphone 15' })

  try {
    const results = await Promise.allSettled([
      trendyol(q),
      hepsiburada(q)
    ])

    const ok = results
      .filter(r => r.status === 'fulfilled' && r.value && r.value.priceNum > 0)
      .map(r => {
        const { site, title, price, priceNum, url } = r.value
        return { site, title, price, url, priceNum }
      })

    let cheapest = null
    if (ok.length) {
      cheapest = ok.reduce((m, x) => (m && m.priceNum <= x.priceNum) ? m : x)
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.status(200).json({
      product: q,
      results: ok.map(({ priceNum, ...rest }) => rest),
      cheapest: cheapest ? { site: cheapest.site, title: cheapest.title, price: cheapest.price, url: cheapest.url } : null
    })
  } catch (e) {
    console.error('compare error', e)
    res.status(500).json({ error: 'beklenmeyen hata' })
  }
}
