import { useState } from 'react';
import {
    xdr,
    Address,
    Operation,
    TransactionBuilder,
    SorobanRpc,
    nativeToScVal
} from 'stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { useWallet } from '../context/WalletContext';
import { parseError } from '../utils/errorParser';

const CONTRACT_ID = "CDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
const RPC_URL = "https://soroban-testnet.stellar.org";

const server = new SorobanRpc.Server(RPC_URL);

export const useVaultContract = () => {
    const { address, isConnected } = useWallet();
    const [loading, setLoading] = useState(false);

    const proposeTransfer = async (
        recipient: string,
        token: string,
        amount: string,
        memo: string
    ) => {
        if (!isConnected || !address) {
            throw new Error("Wallet not connected");
        }
        setLoading(true);
        try {
            const account = await server.getAccount(address);
            const tx = new TransactionBuilder(account, { fee: "100" })
                .setNetworkPassphrase(NETWORK_PASSPHRASE)
                .setTimeout(30)
                .addOperation(Operation.invokeHostFunction({
                    func: xdr.HostFunction.hostFunctionTypeInvokeContract(
                        new xdr.InvokeContractArgs({
                            contractAddress: Address.fromString(CONTRACT_ID).toScAddress(),
                            functionName: "propose_transfer",
                            args: [
                                new Address(address).toScVal(),
                                new Address(recipient).toScVal(),
                                new Address(token).toScVal(),
                                nativeToScVal(BigInt(amount)),
                                xdr.ScVal.scvSymbol(memo),
                            ],
                        })
                    ),
                    auth: [],
                }))
                .build();

            const simulation = await server.simulateTransaction(tx);
            if (SorobanRpc.Api.isSimulationError(simulation)) {
                throw new Error(`Simulation Failed: ${simulation.error}`);
            }
            const preparedTx = SorobanRpc.assembleTransaction(tx, simulation).build();
            const signedXdr = await signTransaction(preparedTx.toXDR(), {
                network: "TESTNET",
            });
            const response = await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr as string, NETWORK_PASSPHRASE));
            return response.hash;
        } catch (e: any) {
            throw parseError(e);
        } finally {
            setLoading(false);
        }
    };

    const getDashboardStats = async () => {
        // Mock data representing a healthy treasury
        return {
            totalProposals: 24,
            pendingApprovals: 3,
            readyToExecute: 1,
            activeSigners: 5,
            threshold: "3/5"
        };
    };

    const getSpendingLimits = async () => {
        // Mock data to show the progress bars in action
        return {
            daily: { used: 450, limit: 1000 },
            weekly: { used: 1200, limit: 5000 }
        };
    };

    const getRecentActivity = async () => {
        // Mocking the "Last 5 Proposals" requirement
        return [
            { id: "101", type: "Transfer", amount: "500 XLM", status: "Pending", date: "2h ago" },
            { id: "100", type: "Transfer", amount: "120 XLM", status: "Executed", date: "5h ago" },
            { id: "099", type: "Transfer", amount: "1,000 XLM", status: "Rejected", date: "1d ago" },
            { id: "098", type: "Transfer", amount: "250 XLM", status: "Executed", date: "2d ago" },
            { id: "097", type: "Transfer", amount: "50 XLM", status: "Expired", date: "3d ago" },
        ];
    };

    return {
        proposeTransfer,
        getDashboardStats,
        getSpendingLimits,
        getRecentActivity,
        loading
    };
};