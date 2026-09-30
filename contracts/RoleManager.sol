// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RoleManager
 * @dev Manages role-based access control for identities and controllers.
 */
contract RoleManager {
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    mapping(bytes32 => mapping(address => bool)) private _roles;
    mapping(address => bytes32[]) private _accountRoles;

    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );
    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "RoleManager: sender must be admin");
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender, msg.sender);
    }

    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _roles[role][account];
    }

    function grantRole(bytes32 role, address account) external onlyAdmin {
        require(!_roles[role][account], "RoleManager: account already has role");
        _grantRole(role, account, msg.sender);
    }

    function revokeRole(bytes32 role, address account) external onlyAdmin {
        require(_roles[role][account], "RoleManager: account does not have role");
        _revokeRole(role, account, msg.sender);
    }

    function _grantRole(bytes32 role, address account, address sender) internal {
        _roles[role][account] = true;
        _accountRoles[account].push(role);
        emit RoleGranted(role, account, sender);
    }

    function _revokeRole(bytes32 role, address account, address sender) internal {
        _roles[role][account] = false;
        emit RoleRevoked(role, account, sender);
    }

    function getRoleBytes(string calldata roleName) external pure returns (bytes32) {
        if (keccak256(bytes(roleName)) == keccak256(bytes("ADMIN"))) {
            return DEFAULT_ADMIN_ROLE;
        }
        return keccak256(abi.encodePacked(roleName, "_ROLE"));
    }
}
