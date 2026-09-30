const fs = require('fs');
const path = require('path');
const solc = require('solc');

function compile() {
  const contractsDir = path.join(__dirname, '..', 'contracts');
  const sources = {};

  const files = ['IdentityRegistry.sol', 'RoleManager.sol', 'AssetNFT.sol'];
  for (const file of files) {
    const filePath = path.join(contractsDir, file);
    sources[file] = {
      content: fs.readFileSync(filePath, 'utf8'),
    };
  }

  const input = {
    language: 'Solidity',
    sources: sources,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  };

  console.log('Compiling Solidity smart contracts...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    let hasError = false;
    for (const error of output.errors) {
      if (error.severity === 'error') {
        console.error('Solidity error:', error.formattedMessage);
        hasError = true;
      } else {
        console.warn('Solidity warning:', error.formattedMessage);
      }
    }
    if (hasError) {
      process.exit(1);
    }
  }

  const artifacts = {};
  for (const contractFile in output.contracts) {
    for (const contractName in output.contracts[contractFile]) {
      const contract = output.contracts[contractFile][contractName];
      artifacts[contractName] = {
        contractName,
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object,
      };
      console.log(`✓ Compiled ${contractName} (${contract.abi.length} ABI items, bytecode length: ${contract.evm.bytecode.object.length})`);
    }
  }

  const outDir = path.join(__dirname, '..', 'src', 'lib', 'blockchain');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outDir, 'artifacts.json'),
    JSON.stringify(artifacts, null, 2),
    'utf8'
  );

  console.log(`Artifacts successfully written to ${path.join(outDir, 'artifacts.json')}`);
}

compile();
