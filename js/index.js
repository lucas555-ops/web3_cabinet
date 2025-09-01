// Web3 Cabinet front logic with balance, network, sign, copy, switch (ethers v6)
(() => {
  const $userId = document.getElementById('userId');
  const $addrBadge = document.getElementById('walletAddress');
  const $netBadge = document.getElementById('networkBadge');
  const $balanceValue = document.getElementById('balanceValue');
  const $btn = document.getElementById('connectBtn');
  const $btnHero = document.getElementById('connectBtnHero');
  const $btnRefresh = document.getElementById('btnRefresh');
  const $btnCopy = document.getElementById('btnCopy');
  const $btnSignHero = document.getElementById('btnSignHero');
  const $btnSwitchMainnet = document.getElementById('btnSwitchMainnet');
  const $addrHuman = document.getElementById('addrHuman');
  const $netHuman = document.getElementById('netHuman');
  const $heroOut = document.getElementById('heroOut');

  const knownChains = {
    1: {name: 'Ethereum Mainnet', symbol: 'ETH', hex: '0x1'},
    137: {name: 'Polygon', symbol: 'MATIC', hex: '0x89'},
    56: {name: 'BSC', symbol: 'BNB', hex: '0x38'},
    42161: {name: 'Arbitrum One', symbol: 'ETH', hex: '0xa4b1'},
    10: {name: 'Optimism', symbol: 'ETH', hex: '0xa'},
    8453: {name: 'Base', symbol: 'ETH', hex: '0x2105'}
  };

  const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');
  const logOut = (t) => { if ($heroOut){ $heroOut.style.display='block'; $heroOut.textContent = String(t); } };

  function getOrCreateUserId() {
    let id = localStorage.getItem('userId');
    if (!id) {
      id = String(Math.floor(10000 + Math.random() * 90000));
      localStorage.setItem('userId', id);
    }
    return id;
  }

  const saveAddress = (addr) => localStorage.setItem('wallet', addr);
  const readAddress = () => localStorage.getItem('wallet');

  function setAddrUI(addr){
    if ($addrBadge) $addrBadge.textContent = addr ? short(addr) : 'Кошелёк не подключен';
    if ($addrHuman) $addrHuman.textContent = addr ? short(addr) : '—';
    if ($btn) $btn.textContent = addr ? 'Connected' : 'Connect';
    if ($btnHero) $btnHero.textContent = addr ? 'Connected' : 'Connect Wallet';
  }

  async function getProvider() {
    if (!window.ethereum) throw new Error('Нет Ethereum провайдера. Установите MetaMask.');
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider;
  }

  async function refreshNetwork() {
    try {
      const provider = await getProvider();
      const net = await provider.getNetwork();
      const id = Number(net.chainId);
      const info = knownChains[id] || {name: `Chain ${id}`, symbol: 'ETH'};
      if ($netBadge) {
        $netBadge.classList.remove('warn');
        $netBadge.classList.add('badge','ok');
        $netBadge.innerHTML = `<i class="fa fa-satellite-dish"></i><span>${info.name}</span>`;
      }
      if ($netHuman) $netHuman.textContent = info.name;
      return { id, info, provider };
    } catch(e) {
      if ($netBadge) {
        $netBadge.classList.add('warn');
        $netBadge.innerHTML = `<i class="fa fa-satellite-dish"></i><span>нет сети</span>`;
      }
      if ($netHuman) $netHuman.textContent = '—';
      throw e;
    }
  }

  async function refreshBalance() {
    try {
      const provider = await getProvider();
      const saved = readAddress();
      if (!saved) throw new Error('Адрес не подключён');
      const balWei = await provider.getBalance(saved);
      const eth = ethers.formatEther(balWei);
      if ($balanceValue) $balanceValue.textContent = `${eth} ETH`;
      logOut(`Balance: ${eth} ETH`);
    } catch(e) {
      logOut(e.message || e);
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert('Нет Ethereum провайдера. Установите MetaMask.');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts?.[0];
      const checksum = ethers.getAddress(account);
      saveAddress(checksum);
      setAddrUI(checksum);
      await refreshNetwork();
      await refreshBalance();
    } catch(e) {
      console.error(e);
      alert('Wallet connection was rejected.');
    }
  }

  async function copyAddress() {
    try {
      const addr = readAddress();
      if (!addr) throw new Error('Сначала подключите кошелёк');
      await navigator.clipboard.writeText(addr);
      logOut('Адрес скопирован в буфер обмена');
    } catch(e) {
      logOut(e.message || e);
    }
  }

  async function signMessage() {
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const message = 'Confirm ownership @ ' + new Date().toISOString();
      const sig = await signer.signMessage(message);
      logOut('Signature: ' + sig);
    } catch(e) {
      logOut(e.message || e);
    }
  }

  async function switchToMainnet() {
    try {
      if (!window.ethereum) throw new Error('Нет провайдера');
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }],
      });
      await refreshNetwork();
      await refreshBalance();
    } catch (switchError) {
      // If the chain has not been added to MetaMask (error code 4902)
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x1',
              chainName: 'Ethereum Mainnet',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://rpc.ankr.com/eth'],
              blockExplorerUrls: ['https://etherscan.io/']
            }],
          });
          await refreshNetwork();
          await refreshBalance();
        } catch (addError) {
          logOut(addError.message || addError);
        }
      } else {
        logOut(switchError.message || switchError);
      }
    }
  }

  function bindEthereumEvents() {
    if (!window.ethereum) return;
    window.ethereum.on?.('accountsChanged', (accs) => {
      if (Array.isArray(accs) && accs[0]) {
        const checksum = ethers.getAddress(accs[0]);
        localStorage.setItem('wallet', checksum);
        setAddrUI(checksum);
        refreshBalance().catch(()=>{});
      } else {
        localStorage.removeItem('wallet');
        setAddrUI(null);
        if ($balanceValue) $balanceValue.textContent = '— ETH';
      }
    });
    window.ethereum.on?.('chainChanged', () => {
      window.location.reload();
    });
  }

  function initUI() {
    if ($userId) $userId.textContent = getOrCreateUserId();
    setAddrUI(readAddress());
    refreshNetwork().catch(()=>{});
    if (readAddress()) refreshBalance().catch(()=>{});
  }

  function bindUI() {
    $btn?.addEventListener('click', connectWallet);
    $btnHero?.addEventListener('click', connectWallet);
    $btnRefresh?.addEventListener('click', refreshBalance);
    $btnCopy?.addEventListener('click', copyAddress);
    $btnSignHero?.addEventListener('click', signMessage);
    $btnSwitchMainnet?.addEventListener('click', switchToMainnet);
  }

  initUI();
  bindUI();
  bindEthereumEvents();
})();
