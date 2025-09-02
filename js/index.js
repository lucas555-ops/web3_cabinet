// Production-ready minimal dApp shell (ethers v6).
// Works on HTTPS (GitHub Pages, Netlify). Requires MetaMask or EVM provider.
(() => {
const $userId = document.getElementById('userId');
const $addrBadge = document.getElementById('walletAddress');
const $netBadge = document.getElementById('networkBadge');
const $balanceValue = document.getElementById('balanceValue');
const $btnConnect = document.getElementById('connectBtn');
const $btnConnectHero = document.getElementById('connectBtnHero');
const $btnRefresh = document.getElementById('btnRefresh');
const $btnCopy = document.getElementById('btnCopy');
const $btnSignHero = document.getElementById('btnSignHero');
const $btnDisconnect = document.getElementById('btnDisconnect');
const $netButtons = document.querySelectorAll('button.net');
const $addrHuman = document.getElementById('addrHuman');
const $netHuman = document.getElementById('netHuman');
const $heroOut = document.getElementById('heroOut');


const short = (a) => (a ? `${a.slice(0,6)}…${a.slice(-4)}` : '');
const logOut = (t, show=true) => {
if (!$heroOut) return;
if (show) $heroOut.style.display = 'block';
$heroOut.textContent = String(t);
};


function getOrCreateUserId() {
let id = localStorage.getItem('userId');
if (!id) { id = String(Math.floor(10000 + Math.random()*90000)); localStorage.setItem('userId', id); }
return id;
}


const saveAddress = (a) => localStorage.setItem('wallet', a);
const readAddress = () => localStorage.getItem('wallet');
const clearAddress = () => localStorage.removeItem('wallet');


async function getProvider() {
if (!window.ethereum) throw new Error('Не найден Ethereum‑провайдер. Установите MetaMask.');
return new ethers.BrowserProvider(window.ethereum);
}


function setAddrUI(addr){
if ($addrBadge) $addrBadge.textContent = addr ? short(addr) : 'Кошелёк не подключен';
if ($addrHuman) $addrHuman.textContent = addr ? short(addr) : '—';
if ($btnConnect) $btnConnect.textContent = addr ? 'Connected' : 'Connect';
if ($btnConnectHero) $btnConnectHero.textContent = addr ? 'Connected' : 'Connect Wallet';
}


async function refreshNetwork() {
try {
const provider = await getProvider();
const net = await provider.getNetwork();
const id = Number(net.chainId);
const info = {
1: 'Ethereum Mainnet',
137: 'Polygon',
42161: 'Arbitrum One',
10: 'Optimism',
8453: 'Base'
}[id] || `Chain ${id}`;


if ($netBadge) {
$netBadge.classList.remove('warn','err');
$netBadge.classList.add('ok');
$netBadge.innerHTML = `<i class="fa fa-satellite-dish"></i><span>${info}</span>`;
}
if ($netHuman) $netHuman.textContent = info;
return { id };
} catch (e) {
if ($netBadge) {
$netBadge.classList.remove('ok');
$netBadge.classList.add('warn');
$netBadge.innerHTML = `<i class="fa fa-satellite-dish"></i><span>нет сети</span>`;
}
})();
