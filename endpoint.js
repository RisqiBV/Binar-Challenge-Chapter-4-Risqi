//File untuk List Endpointnya

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();

app.use(express.json());

// Endpoint untuk menambahkan user baru beserta profilnya (POST)
app.post('/api/v1/users', async (req, res) => {
  try {
    const { name, email, password, profile } = req.body;
    
    // Tambahkan user baru beserta profilnya ke database
    const newUser = await prisma.users.create({
      data: {
        name,
        email,
        password,
        profile: {
          create: profile
        }
      },
      include: {
        profile: true
      }
    });

    res.json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menambahkan user baru' });
  }
});

// Endpoint untuk menampilkan daftar users (GET)
app.get('/api/v1/users', async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      include: {
        profile: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil daftar users' });
  }
});

// Endpoint untuk menampilkan detail informasi user (GET)
app.get('/api/v1/users/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = await prisma.users.findUnique({
      where: {
        id: userId
      },
      include: {
        profile: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil informasi user' });
  }
});

// Endpoint untuk menambahkan akun baru ke pengguna yang sudah didaftarkan (POST)
app.post('/api/v1/accounts', async (req, res) => {
    try {
      const { user_id, bank_name, bank_account_number, balance } = req.body;
      
      // Pastikan user dengan ID yang diberikan ada
      const user = await prisma.users.findUnique({
        where: {
          id: user_id
        }
      });
  
      if (!user) {
        res.status(404).json({ error: 'User tidak ditemukan' });
        return;
      }
  
      // Tambahkan akun baru ke user
      const newAccount = await prisma.bank_account.create({
        data: {
          user_id,
          bank_name,
          bank_account_number,
          balance
        }
      });
  
      res.json(newAccount);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal menambahkan akun baru' });
    }
  });
  
  // Endpoint untuk menampilkan daftar akun (GET)
  app.get('/api/v1/accounts', async (req, res) => {
    try {
      const accounts = await prisma.bank_account.findMany();
      res.json(accounts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal mengambil daftar akun' });
    }
  });
  
  // Endpoint untuk menampilkan detail akun (GET)
  app.get('/api/v1/accounts/:accountId', async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const account = await prisma.bank_account.findUnique({
        where: {
          id: accountId
        }
      });
  
      if (!account) {
        res.status(404).json({ error: 'Akun tidak ditemukan' });
        return;
      }
  
      res.json(account);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal mengambil informasi akun' });
    }
  });

  // Endpoint untuk mengirimkan uang dari satu akun ke akun lain (POST)
app.post('/api/v1/transactions', async (req, res) => {
    try {
      const { source_account_id, destination_account_id, amount } = req.body;
      
      // Pastikan akun sumber (source_account) dan akun tujuan (destination_account) ada
      const sourceAccount = await prisma.bank_account.findUnique({
        where: {
          id: source_account_id
        }
      });
  
      const destinationAccount = await prisma.bank_account.findUnique({
        where: {
          id: destination_account_id
        }
      });
  
      if (!sourceAccount || !destinationAccount) {
        res.status(404).json({ error: 'Akun sumber atau akun tujuan tidak ditemukan' });
        return;
      }
  
      // Pastikan saldo akun sumber cukup untuk transfer
      if (sourceAccount.balance < amount) {
        res.status(400).json({ error: 'Saldo akun sumber tidak mencukupi' });
        return;
      }
  
      // Lakukan transfer
      const updatedSourceAccount = await prisma.bank_account.update({
        where: {
          id: source_account_id
        },
        data: {
          balance: {
            decrement: amount
          }
        }
      });
  
      const updatedDestinationAccount = await prisma.bank_account.update({
        where: {
          id: destination_account_id
        },
        data: {
          balance: {
            increment: amount
          }
        }
      });
  
      // Catat transaksi
      const transaction = await prisma.transactions.create({
        data: {
          source_account_id,
          destination_account_id,
          amount
        }
      });
  
      res.json(transaction);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal melakukan transfer' });
    }
  });
  
  // Endpoint untuk menampilkan daftar transaksi (GET)
  app.get('/api/v1/transactions', async (req, res) => {
    try {
      const transactions = await prisma.transactions.findMany();
      res.json(transactions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal mengambil daftar transaksi' });
    }
  });
  
  // Endpoint untuk menampilkan detail transaksi (GET)
  app.get('/api/v1/transactions/:transactionId', async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      const transaction = await prisma.transactions.findUnique({
        where: {
          id: transactionId
        },
        include: {
          source_account: true,
          destination_account: true
        }
      });
  
      if (!transaction) {
        res.status(404).json({ error: 'Transaksi tidak ditemukan' });
        return;
      }
  
      res.json(transaction);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal mengambil informasi transaksi' });
    }
  });

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});