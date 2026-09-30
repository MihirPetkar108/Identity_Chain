// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRoleManager {
    function hasRole(bytes32 role, address account) external view returns (bool);
}

interface IIdentityRegistry {
    function isEnrolled(address controller) external view returns (bool);
}

/**
 * @title AssetNFT
 * @dev Smart-contract-authorized NFT minting and transfer contract.
 */
contract AssetNFT {
    string public name = "Identity Verifiable Asset";
    string public symbol = "IVA";
    uint256 private _nextTokenId = 1;

    address public roleManager;
    address public identityRegistry;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct TokenMetadata {
        uint256 id;
        string name;
        string description;
        string uri;
        address minter;
        uint256 mintedAt;
    }

    mapping(uint256 => address) private _owners;
    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => TokenMetadata) private _tokenData;

    event NFTMinted(
        uint256 indexed tokenId,
        address indexed minter,
        address indexed recipient,
        string tokenName
    );

    event TransferRequested(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );

    event TransferCompleted(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );

    constructor(address _roleManager, address _identityRegistry) {
        roleManager = _roleManager;
        identityRegistry = _identityRegistry;
    }

    /**
     * @notice Mints a new NFT to recipient. Requires DID enrollment or MINTER_ROLE.
     */
    function mint(
        address recipient,
        string calldata tokenName,
        string calldata description,
        string calldata uri
    ) external returns (uint256) {
        require(recipient != address(0), "AssetNFT: invalid recipient");
        
        // Smart contract authorization check
        bool hasMinterRole = IRoleManager(roleManager).hasRole(MINTER_ROLE, msg.sender);
        bool isEnrolled = IIdentityRegistry(identityRegistry).isEnrolled(msg.sender);

        require(
            hasMinterRole || isEnrolled,
            "AssetNFT: unauthorized - caller lacks MINTER role and is not enrolled DID"
        );

        uint256 tokenId = _nextTokenId++;
        _owners[tokenId] = recipient;
        _ownedTokens[recipient].push(tokenId);

        _tokenData[tokenId] = TokenMetadata({
            id: tokenId,
            name: tokenName,
            description: description,
            uri: uri,
            minter: msg.sender,
            mintedAt: block.timestamp
        });

        emit NFTMinted(tokenId, msg.sender, recipient, tokenName);
        return tokenId;
    }

    /**
     * @notice Transfers an NFT.
     */
    function transfer(
        address to,
        uint256 tokenId
    ) external {
        require(to != address(0), "AssetNFT: invalid recipient");
        address owner = _owners[tokenId];
        require(owner != address(0), "AssetNFT: nonexistent token");
        require(msg.sender == owner, "AssetNFT: caller is not token owner");

        emit TransferRequested(tokenId, msg.sender, to);

        _owners[tokenId] = to;
        _removeTokenFromOwner(msg.sender, tokenId);
        _ownedTokens[to].push(tokenId);

        emit TransferCompleted(tokenId, msg.sender, to);
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "AssetNFT: token does not exist");
        return owner;
    }

    function getTokenData(uint256 tokenId) external view returns (
        uint256 id,
        string memory tokenName,
        string memory description,
        string memory uri,
        address minter,
        uint256 mintedAt
    ) {
        TokenMetadata memory data = _tokenData[tokenId];
        return (data.id, data.name, data.description, data.uri, data.minter, data.mintedAt);
    }

    function getTokensOfOwner(address owner) external view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function _removeTokenFromOwner(address from, uint256 tokenId) internal {
        uint256[] storage tokens = _ownedTokens[from];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }
}
