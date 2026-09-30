// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IdentityRegistry
 * @dev Manages DID identifier to controller address mappings and identity enrollment.
 */
contract IdentityRegistry {
    address public admin;

    struct Identity {
        string did;
        address controller;
        uint256 enrolledAt;
        bool active;
    }

    // Mapping from controller address to Identity
    mapping(address => Identity) private _identitiesByController;
    // Mapping from DID string to controller address
    mapping(string => address) private _didToController;
    // Array of all enrolled controllers for discovery
    address[] private _allControllers;

    event IdentityEnrolled(
        string did,
        address indexed controller,
        uint256 timestamp
    );
    event IdentityDeactivated(
        string did,
        address indexed controller,
        uint256 timestamp
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "IdentityRegistry: caller is not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @notice Enrolls or associates a DID with a controller address.
     */
    function enrollIdentity(string calldata did, address controller) external {
        require(controller != address(0), "IdentityRegistry: invalid controller");
        require(bytes(did).length > 0, "IdentityRegistry: empty DID");
        require(_didToController[did] == address(0) || _didToController[did] == controller, "IdentityRegistry: DID already bound");

        if (_identitiesByController[controller].controller == address(0)) {
            _allControllers.push(controller);
        }

        _identitiesByController[controller] = Identity({
            did: did,
            controller: controller,
            enrolledAt: block.timestamp,
            active: true
        });

        _didToController[did] = controller;

        emit IdentityEnrolled(did, controller, block.timestamp);
    }

    /**
     * @notice Returns controller address for a DID.
     */
    function getController(string calldata did) external view returns (address) {
        return _didToController[did];
    }

    /**
     * @notice Returns identity details for a controller.
     */
    function getIdentity(address controller) external view returns (string memory did, address ctrl, uint256 enrolledAt, bool active) {
        Identity memory id = _identitiesByController[controller];
        return (id.did, id.controller, id.enrolledAt, id.active);
    }

    /**
     * @notice Checks if controller is actively enrolled.
     */
    function isEnrolled(address controller) external view returns (bool) {
        return _identitiesByController[controller].active;
    }

    /**
     * @notice Returns enrollment timestamp for an identity.
     */
    function getEnrollmentTimestamp(address controller) external view returns (uint256) {
        return _identitiesByController[controller].enrolledAt;
    }

    /**
     * @notice Returns all enrolled controllers.
     */
    function getAllControllers() external view returns (address[] memory) {
        return _allControllers;
    }
}
