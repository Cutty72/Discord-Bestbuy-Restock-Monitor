import got from 'got';
import tough from 'tough-cookie';


//Add webhook and SKU here and run the script.
let cookieJar = new tough.CookieJar()
let SKU: string = '4901809';
let discordUrl: string = '';


async function getStock() {
    let inStock = false;
    while (inStock === false) {
        try {
            console.log(`Monitoring.`)
            const response: any = await got.get(`https://www.bestbuy.com/api/3.0/priceBlocks?skus=${SKU}`, {
                headers: {
                    'authority': 'www.bestbuy.com',
                    'pragma': 'no-cache',
                    'cache-control': 'no-cache',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'upgrade-insecure-requests': '1',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36',
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                    'sec-fetch-site': 'none',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-user': '?1',
                    'sec-fetch-dest': 'document',
                    'accept-language': 'en-US,en;q=0.9',
                    'cookie': ''
                },
                cookieJar: cookieJar,
                responseType: 'json'
            })
            let skuSplit = /[0-9]{4}/g;
            const productData = {
                skuId: response.body[0].sku.skuId,
                productName: response.body[0].sku.names.short,
                productPrice: `$${response.body[0].sku.price.currentPrice}`,
                imageCode: response.body[0].sku.skuId.match(skuSplit)[0],
                productLink: response.body[0].sku.url
            };
            let stockStatus = response.body[0].sku.buttonState.buttonState;
            if (stockStatus === 'ADD_TO_CART') {
                console.log(`Instock!`)
                await sendWebhook(productData);
                inStock = true
            }
            // If not in stock, wait 1.5 seconds before checking again.
            await sleep(1500)
        } catch(error: any) {
            console.log(error.message)
        }
    }
};


/** Send webhook notification that the product is in stock */
async function sendWebhook(productData: any) {
    try {
        const res: any = await got.post(discordUrl, {
            headers: {
                'Content-Type': 'application/json'
            },
            json: {
                "content": null,
                "embeds": [{
                    "title": `BESTBUY RESTOCK!\nhttps://www.bestbuy.com${productData.productLink}`,
                    "color": 6422407,
                    "fields": [{
                            "name": "Product Title",
                            "value": `${productData.productName}`,
                            "inline": true
                        },
                        {
                            "name": "Product Price",
                            "value": `${productData.productPrice}`,
                            "inline": true
                        },
                        {
                            "name": "ATC LINKS",
                            "value": `[[ATC]](https://api.bestbuy.com/click/-/${productData.skuId}/cart/)`
                        }
                    ],
                    "footer": {
                        "text": `Bestbuy Monitor | ${Date.now()}`,
                        "icon_url": "https://pisces.bbystatic.com/image2/BestBuy_US/Gallery/BestBuy_Logo_2020-190616.png;maxHeight=80;maxWidth=136"
                    },
                    "thumbnail": {
                        "url": `https://pisces.bbystatic.com/image2/BestBuy_US/images/products/${productData.imageCode}/${productData.skuId}_sd.jpg;maxHeight=640;maxWidth=550`
                    }
                }]
            }
        })
    } catch (e: any) {
        console.log(e.message)
    }
};

getStock()

const sleep = (waitTimeInMs: number) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));
