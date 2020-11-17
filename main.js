const axios = require('axios');
const crypto = require('crypto');
const qs = require('qs');

const binanceConfig = {
  API_KEY: 'YDneln48yl6Iqowx8pRJGLUkEF44sLphFhS6rtscc3SBfEUVRmxLm4oN82H2NypS',
  API_SECRET: 'Z6k6Ur37zGnzOUgWEeIyFEY5FCM2WNuGFNOH7DC7nA4B8qG8iVYIXxuFJPL9Q0Uk',
  HOST_URL: 'https://fapi.binance.com',
};



const buildSign = (data, config) => {
  return crypto.createHmac('sha256', config.API_SECRET).update(data).digest('hex');
};

const privateRequest = async (data, endPoint, type) => {
  const dataQueryString = qs.stringify(data);
  
  const signature = buildSign(dataQueryString, binanceConfig);
  const requestConfig = {
    method: type,
    url: binanceConfig.HOST_URL + endPoint + '?' + dataQueryString + '&signature=' + signature,
    headers: {
       "X-MBX-APIKEY": binanceConfig.API_KEY,
    },
  };

  try {
    
    const response = await axios(requestConfig);
    
    return response;
  }
  catch (err) {
    
    return err;
  }
};

const publicRequest = async (data , endPoint , type) => {
  const dataQueryString = qs.stringify(data)

  const requestConfig ={
    method : type,
    url : binanceConfig.HOST_URL + endPoint + '?' + dataQueryString
  }

  try {
    
    const response = await axios(requestConfig);
    
    return response;
  }
  catch (err) {
    
    return err;
  }

}

let prvPrice = 0

const getSymbolPriceFake =async (symbol) => {
  const data = {
    symbol : symbol
  }

  res=await publicRequest(data , '/fapi/v1/premiumIndex' , 'GET')
  if(res.data == undefined)
  {
    const pp = {
      price : prvPrice
    }
    return pp
  }

  prvPrice = res.data.price
  
  return res.data

}


const getSymbolPrice =async (symbol) => {
  const data = {
    symbol : symbol
  }

  res=await publicRequest(data , '/fapi/v1/ticker/price' , 'GET')
  if(res.data == undefined)
  {
    const pp = {
      price : prvPrice
    }
    return pp
  }

  prvPrice = res.data.price
  
  return res.data

}


const setTradeOrder = async(symbol , side , positionSide ,  quantity , price ) =>{

  const data = {
    symbol: symbol,
    side : side,
    quantity : quantity,
    price : price,
    timestamp: Date.now(),
    type : "LIMIT",
    timeInForce : "GTC",
    positionSide : positionSide
  };
  

  res=await privateRequest(data , '/fapi/v1/order' , 'POST')
  if(res.response != undefined && res.response.status == 400)
  {
    
    return res.response.data
  }
  else{
    
    return res.data
  }
  
}

const cancelAllOpenOrders = async(symbol) =>{
  const data ={
    symbol : symbol,
    timestamp :Date.now()
  }
}


const cancleOrderById = async(symbol , orderId)=>{
  data ={
    symbol : symbol,
    orderId : orderId,
    timestamp :Date.now()
  }

  res=await privateRequest(data , '/fapi/v1/order' , 'DELETE')
  if(res.response != undefined && res.response.status == 400)
  {
    
    return res.response.data
  }
  else{
    
    return res.data
  }
}



const changeSymbolLeverage = async(symbol , leverage) => {
  data = {
    symbol : symbol ,
    leverage : leverage,
    timestamp: Date.now()
  }

  res=await privateRequest(data , '/fapi/v1/leverage' , 'POST')
  if(res.response != undefined && res.response.status == 400)
  {
    
    return res.response.data
  }
  else{
    
    return res.data
  }
}

const changePositionType = async (type)=>{
  data = {
    dualSidePosition : type,
    timestamp: Date.now()
  }
  res=await privateRequest(data , '/fapi/v1/positionSide/dual' , 'POST')
  if(res.response != undefined && res.response.status == 400)
  {
    
    return res.response.data
  }
  else{
    
    return res.data
  }
}



const getOpenPostitions = async (symbol)=>{
  data = {
    symbol : symbol,
    timestamp: Date.now()
  }
  res=await privateRequest(data , '/fapi/v2/positionRisk' , 'GET')
  if(res.response != undefined && res.response.status == 400)
  {
    
    return res.response.data
  }
  else{
    
    return res.data
  }
}




const main = async()=>{
 
  ////// setting leverage to *4
  
  /////initiation phase

  let price = await getSymbolPrice("BNBUSDT")
  price=price.price
  price = price 
  console.log(price)
  let UpperPrice =parseFloat(price)+1
  
  let res = await setTradeOrder("BNBUSDT" , "BUY" , "BOTH" , "0.01" , UpperPrice)
  
  let trade = {
    entryPrice : price,
    orderId : res.orderId,
    side : res.side,
    quantity : 0.01
  }
  console.log('initiation phase')
  console.log(trade)
  //
  // /checking the takeProfit and action Phase
  while(true)
  {
   
    let curPrice = await getSymbolPrice("BNBUSDT")

    
    let distance = curPrice.price- trade.entryPrice
    distance = (distance/trade.entryPrice) * 2 * 100
    console.log(`distance : ${distance}`)
    if(trade.side == "BUY" && distance >= 0.24 )
    {
      console.log('phase 1')
      let price = await getSymbolPrice("BNBUSDT")
      price=price.price
      UpperPrice =parseFloat(price)+1

      let res = await setTradeOrder("BNBUSDT" , "BUY" , "BOTH" , "0.01" , UpperPrice)
      trade.entryPrice = price
      trade.orderId = res.orderId
      trade.side = res.side
      trade.quantity = trade.quantity + 0.01
      console.log(trade)
      
    }
    else if(trade.side == "BUY" && distance <= -0.08){
      console.log('phase 2')
      let price = await getSymbolPrice("BNBUSDT")
      price=price.price
      UpperPrice =parseFloat(price)-1

      let res = await setTradeOrder("BNBUSDT" , "SELL" , "BOTH" , trade.quantity , UpperPrice)
      console.log(trade)
      ////action getPosition reverseMode

      price = await getSymbolPrice("BNBUSDT")
      price = price.price
      UpperPrice =parseFloat(price)-1

      res = await setTradeOrder("BNBUSDT" , "SELL" , "BOTH" , "0.01" , UpperPrice )
      trade.entryPrice = price,
      trade.orderId = res.orderId,
      trade.side = res.side ,
      trade.quantity = 0.01
      console.log(trade)
     
    }
    else if(trade.side == "SELL" && distance <= -0.24)
    {
      console.log('phase 3')
      let price = await getSymbolPrice("BNBUSDT")
      price=price.price
      UpperPrice =parseFloat(price)-1

      let res = await setTradeOrder("BNBUSDT" , "SELL" , "BOTH" , "0.01" , UpperPrice)
      trade.entryPrice = price
      trade.orderId = res.orderId
      trade.side = res.side
      trade.quantity = trade.quantity + 0.01
      console.log(trade)
      
    }
    else if(trade.side == "SELL" && distance >= 0.08)
    {
      console.log('phase 4')
      let price = await getSymbolPrice("BNBUSDT")
      price=price.price
      UpperPrice =parseFloat(price)+1
      console.log(trade)
      let res = await setTradeOrder("BNBUSDT" , "BUY" , "BOTH" , trade.quantity , UpperPrice)

      price = await getSymbolPrice("BNBUSDT")
      price= price.price
      UpperPrice =parseFloat(price)+1

      //// reverseMode action

      res = await setTradeOrder("BNBUSDT" , "BUY" , "BOTH" , "0.01" , UpperPrice)
      trade.entryPrice = price
      trade.orderId = res.orderId
      trade.quantity = 0.01
      trade.side = res.side
      console.log(trade)
    
    }
    
  }



  }

  


main()

