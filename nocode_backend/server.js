// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const walletService = require('./walletService');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Wallet generation endpoint
/**
 output format
 {
    "success": true,
    "wallet": {
        "address": "0x352425ab2c9cec336f16d6856d29cc0ce003b9f157285da951a86a8c6ce490dc",
        "privateKey": {
            "keypair": {
                "publicKey": {
                    "0": 101,
                    "1": 196,
                    "2": 78,
                    "3": 23,
                    "4": 122,
                    "5": 138,
                    "6": 187,
                    "7": 25,
                    "8": 117,
                    "9": 211,
                    "10": 67,
                    "11": 11,
                    "12": 255,
                    "13": 239,
                    "14": 15,
                    "15": 167,
                    "16": 101,
                    "17": 231,
                    "18": 135,
                    "19": 8,
                    "20": 52,
                    "21": 145,
                    "22": 107,
                    "23": 169,
                    "24": 149,
                    "25": 106,
                    "26": 110,
                    "27": 197,
                    "28": 11,
                    "29": 216,
                    "30": 199,
                    "31": 43
                },
                "secretKey": {
                    "0": 208,
                    "1": 0,
                    "2": 66,
                    "3": 168,
                    "4": 84,
                    "5": 164,
                    "6": 10,
                    "7": 231,
                    "8": 77,
                    "9": 249,
                    "10": 140,
                    "11": 113,
                    "12": 99,
                    "13": 195,
                    "14": 12,
                    "15": 85,
                    "16": 78,
                    "17": 31,
                    "18": 51,
                    "19": 116,
                    "20": 156,
                    "21": 248,
                    "22": 64,
                    "23": 101,
                    "24": 158,
                    "25": 111,
                    "26": 127,
                    "27": 101,
                    "28": 70,
                    "29": 101,
                    "30": 127,
                    "31": 49,
                    "32": 101,
                    "33": 196,
                    "34": 78,
                    "35": 23,
                    "36": 122,
                    "37": 138,
                    "38": 187,
                    "39": 25,
                    "40": 117,
                    "41": 211,
                    "42": 67,
                    "43": 11,
                    "44": 255,
                    "45": 239,
                    "46": 15,
                    "47": 167,
                    "48": 101,
                    "49": 231,
                    "50": 135,
                    "51": 8,
                    "52": 52,
                    "53": 145,
                    "54": 107,
                    "55": 169,
                    "56": 149,
                    "57": 106,
                    "58": 110,
                    "59": 197,
                    "60": 11,
                    "61": 216,
                    "62": 199,
                    "63": 43
                }
            }
        },
        "secretKey": "suiprivkey1qrgqqs4g2jjq4e6dlxx8zc7rp325u8enwjw0ssr9nehh7e2xv4lnzzansjy"
    }
}
 */
app.post('/api/wallet/generate', (req, res) => {
  console.log("Generate Wallet Api called")
  try {
    // Use the wallet service to generate a new wallet
    const wallet = walletService.generateWallet();


    res.json({
      success: true,
      wallet
    });
  } catch (error) {
    console.error('Error generating wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate wallet',
      message: error.message
    });
  }
});

// Get wallet balance
/** 
  input
 {
 "address":"0x....." 
 }
 */
app.post('/api/wallet/balance', async (req, res) => {

  try {
    const { address } = req.body;
    console.log("Get balance api called for: ", address);

    // Use the wallet service to get the balance
    const balance = await walletService.getWalletBalance(address);

    res.json({
      success: true,
      message: "This endpoint would connect to Sui RPC to get real balance data. For now, it's a placeholder.",
      balance
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet balance',
      message: error.message
    });
  }
});

// Basic health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Sui Wallet API is running'
  });
});

app.listen(PORT, () => {
  console.log(`Wallet Server running on port ${PORT}`);
});