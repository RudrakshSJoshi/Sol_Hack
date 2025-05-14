const BN = require('bn.js');
const sdkLib = require('@cetusprotocol/cetus-sui-clmm-sdk');

const {
  adjustForSlippage,
  d,
  Percentage,
  TransactionUtil,
  buildTestAccount
} = sdkLib;

const {generateWallet} = require('./walletService');
const initCetusSDK = sdkLib.initCetusSDK.default; // Fix for default import in CommonJS

(async () => {
  const sdk = initCetusSDK({ network: 'mainnet' });
  const sendKeypair = generateWallet();

  console.log("Address: ", sendKeypair.getPublicKey().toSuiAddress());

  const poolAddress = '0x6fd4915e6d8d3e2ba6d81787046eb948ae36fdfc75dad2e24f0d4aaa2417a416';
  const a2b = true;
  const byAmountIn = true;
  const amount = new BN(120000); // input amount
  const slippage = Percentage.fromDecimal(d(5)); // 5% slippage

  // Fetch pool and ticks
  const pool = await sdk.Pool.getPool(poolAddress);
  const swapTicks = await sdk.Pool.fetchTicks({
    pool_id: pool.poolAddress,
    coinTypeA: pool.coinTypeA,
    coinTypeB: pool.coinTypeB
  });

  console.log("swapTicks length:", swapTicks.length);

  // Pre-swap estimate
  const res = sdk.Swap.calculateRates({
    decimalsA: 6,
    decimalsB: 6,
    a2b,
    byAmountIn,
    amount,
    swapTicks,
    currentPool: pool
  });

  console.log("calculateRates###res###", {
    estimatedAmountIn: res.estimatedAmountIn.toString(),
    estimatedAmountOut: res.estimatedAmountOut.toString(),
    estimatedEndSqrtPrice: res.estimatedEndSqrtPrice.toString(),
    estimatedFeeAmount: res.estimatedFeeAmount.toString(),
    isExceed: res.isExceed,
    extraComputeLimit: res.extraComputeLimit,
    amount: res.amount.toString(),
    aToB: res.aToB,
    byAmountIn: res.byAmountIn,
  });

  const toAmount = byAmountIn ? res.estimatedAmountOut : res.estimatedAmountIn;
  const amountLimit = adjustForSlippage(toAmount, slippage, !byAmountIn);
  const partner = '0x8e0b7668a79592f70fbfb1ae0aebaf9e2019a7049783b9a4b6fe7c6ae038b528';

  // Create swap payload
  const swapPayload = sdk.Swap.createSwapTransactionPayload({
    pool_id: pool.poolAddress,
    coinTypeA: pool.coinTypeA,
    coinTypeB: pool.coinTypeB,
    a2b,
    by_amount_in: byAmountIn,
    amount: res.amount.toString(),
    amount_limit: amountLimit.toString(),
    swap_partner: partner,
  });

  // Sign and execute transaction
  const swapTxn = await sdk.fullClient.signAndExecuteTransactionBlock({
    signer: sendKeypair,
    transactionBlock: swapPayload,
  });

  console.log('Swap Transaction:', swapTxn);
})();
