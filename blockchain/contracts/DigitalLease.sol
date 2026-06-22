// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DigitalLease
 * @dev Sistem Manajemen Sewa Kost Terdesentralisasi
 * 
 * Fitur:
 * - Registrasi penyewa oleh pemilik properti
 * - Pembayaran sewa otomatis via smart contract
 * - Pengenaan denda keterlambatan berbasis block.timestamp
 * - Emisi event untuk integrasi IoT (kunci pintu)
 */
contract DigitalLease {
    // ============ State Variables ============

    address public owner;
    uint256 public rentAmount;       // Jumlah sewa bulanan (dalam Wei)
    uint256 public leaseDuration;    // Durasi sewa per pembayaran (dalam detik, default 30 hari)
    uint256 public penaltyRate;      // Persentase denda (misal: 10 = 10%)
    uint256 public gracePeriod;      // Masa tenggang sebelum denda (dalam detik)

    struct Tenant {
        address wallet;
        string name;
        uint256 roomNumber;
        uint256 leaseStart;
        uint256 leaseEnd;
        bool isActive;
        bool isRegistered;
        uint256 totalPaid;
        uint256 totalPenalties;
    }

    mapping(address => Tenant) public tenants;
    address[] public tenantList;
    mapping(address => bool) public isAdmin;

    // ============ Events ============

    event TenantRegistered(address indexed tenant, string name, uint256 roomNumber);
    event RentPaid(address indexed tenant, uint256 amount, uint256 newEndTime);
    event PenaltyPaid(address indexed tenant, uint256 penaltyAmount);
    event LeaseExpired(address indexed tenant);
    event TenantRemoved(address indexed tenant);
    event DoorAccessOverride(address indexed tenant, bool locked);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event RentAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event AdminStatusUpdated(address indexed account, bool status);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Hanya pemilik yang diizinkan");
        _;
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Hanya admin yang diizinkan");
        _;
    }

    modifier onlyRegistered() {
        require(tenants[msg.sender].isRegistered, "Penyewa belum terdaftar");
        _;
    }

    // ============ Constructor ============

    /**
     * @param _rentAmount Jumlah sewa dalam Wei
     * @param _leaseDurationDays Durasi sewa per pembayaran dalam hari
     * @param _penaltyRate Persentase denda keterlambatan (misal: 10 = 10%)
     * @param _gracePeriodHours Masa tenggang dalam jam sebelum denda berlaku
     */
    constructor(
        uint256 _rentAmount,
        uint256 _leaseDurationDays,
        uint256 _penaltyRate,
        uint256 _gracePeriodHours
    ) {
        owner = msg.sender;
        isAdmin[msg.sender] = true;
        emit AdminStatusUpdated(msg.sender, true);
        rentAmount = _rentAmount;
        leaseDuration = _leaseDurationDays * 1 days;
        penaltyRate = _penaltyRate;
        gracePeriod = _gracePeriodHours * 1 hours;
    }

    // ============ Admin & Owner Functions ============

    /**
     * @dev Menambah atau menghapus admin
     * @param _account Alamat wallet
     * @param _status Status admin
     */
    function setAdmin(address _account, bool _status) external onlyAdmin {
        require(_account != address(0), "Alamat tidak valid");
        isAdmin[_account] = _status;
        emit AdminStatusUpdated(_account, _status);
    }

    /**
     * @dev Mendaftarkan penyewa baru
     * @param _tenant Alamat wallet penyewa
     * @param _name Nama penyewa
     * @param _roomNumber Nomor kamar
     * @param _initialDays Durasi akses gratis awal dalam hari
     */
    function registerTenant(
        address _tenant,
        string calldata _name,
        uint256 _roomNumber,
        uint256 _initialDays
    ) external onlyAdmin {
        require(!tenants[_tenant].isRegistered, "Penyewa sudah terdaftar");
        require(_tenant != address(0), "Alamat tidak valid");

        uint256 startTime = _initialDays > 0 ? block.timestamp : 0;
        uint256 endTime = _initialDays > 0 ? block.timestamp + (_initialDays * 1 days) : 0;
        bool active = _initialDays > 0;

        tenants[_tenant] = Tenant({
            wallet: _tenant,
            name: _name,
            roomNumber: _roomNumber,
            leaseStart: startTime,
            leaseEnd: endTime,
            isActive: active,
            isRegistered: true,
            totalPaid: 0,
            totalPenalties: 0
        });

        tenantList.push(_tenant);
        emit TenantRegistered(_tenant, _name, _roomNumber);

        if (active) {
            emit DoorAccessOverride(_tenant, false);
        }
    }

    /**
     * @dev Menghapus penyewa dari sistem
     * @param _tenant Alamat wallet penyewa
     */
    function removeTenant(address _tenant) external onlyAdmin {
        require(tenants[_tenant].isRegistered, "Penyewa tidak ditemukan");
        
        tenants[_tenant].isRegistered = false;
        tenants[_tenant].isActive = false;
        
        // Hapus dari array
        for (uint256 i = 0; i < tenantList.length; i++) {
            if (tenantList[i] == _tenant) {
                tenantList[i] = tenantList[tenantList.length - 1];
                tenantList.pop();
                break;
            }
        }
        
        emit TenantRemoved(_tenant);
        emit LeaseExpired(_tenant);
    }

    /**
     * @dev Admin dapat melakukan override terhadap akses pintu (membuka/mengunci manual)
     * @param _tenant Alamat wallet penyewa
     * @param _lock True = Kunci pintu, False = Buka pintu
     * @param _additionalDays Jumlah hari tambahan akses jika membuka pintu
     */
    function overrideDoorAccess(address _tenant, bool _lock, uint256 _additionalDays) external onlyAdmin {
        require(tenants[_tenant].isRegistered, "Penyewa tidak ditemukan");
        
        tenants[_tenant].isActive = !_lock;
        
        if (!_lock) {
            if (_additionalDays > 0) {
                tenants[_tenant].leaseEnd = block.timestamp + (_additionalDays * 1 days);
            }
        } else {
            tenants[_tenant].leaseEnd = 0;
        }

        emit DoorAccessOverride(_tenant, _lock);
    }

    /**
     * @dev Tarik dana dari kontrak
     */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Tidak ada dana untuk ditarik");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Penarikan gagal");
        
        emit FundsWithdrawn(owner, balance);
    }

    /**
     * @dev Update jumlah sewa
     * @param _newAmount Jumlah sewa baru dalam Wei
     */
    function updateRentAmount(uint256 _newAmount) external onlyAdmin {
        require(_newAmount > 0, "Jumlah sewa harus > 0");
        uint256 oldAmount = rentAmount;
        rentAmount = _newAmount;
        emit RentAmountUpdated(oldAmount, _newAmount);
    }

    // ============ Tenant Functions ============

    /**
     * @dev Membayar sewa. Jika telat, wajib bayar sewa + denda.
     */
    function payRent(uint256 _days) external payable onlyRegistered {
        require(_days > 0, "Durasi sewa minimal 1 hari");
        Tenant storage tenant = tenants[msg.sender];
        
        uint256 requiredRent = (rentAmount * _days) / (leaseDuration / 1 days);
        uint256 requiredAmount = requiredRent;
        uint256 penalty = 0;

        // Cek apakah ada keterlambatan & denda
        if (tenant.leaseEnd > 0 && block.timestamp > tenant.leaseEnd + gracePeriod) {
            penalty = (requiredRent * penaltyRate) / 100;
            requiredAmount = requiredRent + penalty;
        }

        require(msg.value >= requiredAmount, "Jumlah pembayaran kurang");

        uint256 addedDuration = _days * 1 days;

        // Update status sewa
        if (tenant.leaseEnd > 0 && block.timestamp <= tenant.leaseEnd) {
            // Perpanjangan sebelum jatuh tempo
            tenant.leaseEnd += addedDuration;
        } else {
            // Sewa baru atau setelah jatuh tempo
            tenant.leaseStart = block.timestamp;
            tenant.leaseEnd = block.timestamp + addedDuration;
        }

        tenant.isActive = true;
        tenant.totalPaid += msg.value;

        if (penalty > 0) {
            tenant.totalPenalties += penalty;
            emit PenaltyPaid(msg.sender, penalty);
        }

        emit RentPaid(msg.sender, msg.value, tenant.leaseEnd);

        // Refund kelebihan pembayaran
        if (msg.value > requiredAmount) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - requiredAmount}("");
            require(success, "Refund gagal");
        }
    }

    // ============ View Functions ============

    /**
     * @dev Mendapatkan status sewa penyewa
     * @param _tenant Alamat wallet penyewa
     * @return isActive Status aktif sewa
     * @return endTime Waktu berakhir sewa (unix timestamp)
     */
    function getLeaseStatus(address _tenant) external view returns (bool isActive, uint256 endTime) {
        Tenant memory tenant = tenants[_tenant];
        
        if (!tenant.isRegistered) {
            return (false, 0);
        }

        // Cek apakah sewa sudah melewati jatuh tempo
        bool active = tenant.isActive && (tenant.leaseEnd == 0 || block.timestamp <= tenant.leaseEnd);
        return (active, tenant.leaseEnd);
    }

    /**
     * @dev Mendapatkan detail lengkap penyewa
     * @param _tenant Alamat wallet penyewa
     */
    function getTenantDetails(address _tenant) external view returns (
        string memory name,
        uint256 roomNumber,
        uint256 leaseStart,
        uint256 leaseEnd,
        bool isActive,
        bool isRegistered,
        uint256 totalPaid,
        uint256 totalPenalties
    ) {
        Tenant memory t = tenants[_tenant];
        bool active = t.isActive && (t.leaseEnd == 0 || block.timestamp <= t.leaseEnd);
        return (t.name, t.roomNumber, t.leaseStart, t.leaseEnd, active, t.isRegistered, t.totalPaid, t.totalPenalties);
    }

    /**
     * @dev Mendapatkan jumlah denda saat ini untuk penyewa
     * @param _tenant Alamat wallet penyewa
     */
    function getCurrentPenalty(address _tenant, uint256 _days) external view returns (uint256) {
        if (_days == 0) return 0;
        Tenant memory tenant = tenants[_tenant];
        if (tenant.leaseEnd > 0 && block.timestamp > tenant.leaseEnd + gracePeriod) {
            uint256 requiredRent = (rentAmount * _days) / (leaseDuration / 1 days);
            return (requiredRent * penaltyRate) / 100;
        }
        return 0;
    }

    /**
     * @dev Mendapatkan jumlah total penyewa terdaftar
     */
    function getTenantCount() external view returns (uint256) {
        return tenantList.length;
    }

    /**
     * @dev Mendapatkan alamat penyewa berdasarkan indeks
     * @param _index Indeks dalam array tenantList
     */
    function getTenantByIndex(uint256 _index) external view returns (address) {
        require(_index < tenantList.length, "Index di luar batas");
        return tenantList[_index];
    }

    /**
     * @dev Mendapatkan saldo kontrak
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ============ Fallback ============

    receive() external payable {}
}
