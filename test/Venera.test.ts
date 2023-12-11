import { expect, ethers, ContractTransactionResponse,  Venera } from "./setup";

describe("Venera", async () => {

    let owner: any
    let acc1: any
    let acc2: any
    let venera: Venera & { deploymentTransaction(): ContractTransactionResponse; }
    
    beforeEach(async function() {
        [ owner, acc1, acc2] = await ethers.getSigners();
        const Venera = await ethers.getContractFactory("Venera");
        venera = await Venera.deploy(owner.address);
    })

    async function sendETH(sender: any, amount: any) {
        const txData = {
            to: venera.target,
            value: amount
        };
        return await sender.sendTransaction(txData);
    }

    it("Should be deployes", async function() {
        await expect(venera.target).to.be.properAddress;
    });

    describe("Balance", () => {
    
        it("Should withdraw ETH balance", async function() {
            expect(await venera.getBalance()).to.equal(0);
            await sendETH(acc1, ethers.parseEther("1"));
            await expect(await venera.getBalance()).to.equal(ethers.parseEther("1"));
            await expect(() => venera.connect(owner).withdraw())
                .to.changeEtherBalances([venera, owner], [-(ethers.parseEther("1")), ethers.parseEther("1")]);
            await expect(await venera.getBalance()).to.equal(0);
            await expect(venera.connect(owner).withdraw()).to.be.revertedWith("No balance to withdraw");
        });
    
        it("Should prevent non-owner from withdrawing ETH", async function() {
            await sendETH(acc1, ethers.parseEther("1"));
            await expect(await venera.getBalance()).to.equal(ethers.parseEther("1"));
            await expect(
                venera.connect(acc2).withdraw()
            ).to.be.reverted;
            await expect(await venera.getBalance()).to.equal(ethers.parseEther("1"));
        });
        
        it("Should calculate the correct total balance of the contract", async function() {
            await sendETH(owner, ethers.parseEther("1"));
            await sendETH(acc1, ethers.parseEther("2"));
            await sendETH(acc2, ethers.parseEther("3"));
            await expect(await venera.getBalance()).to.equal(ethers.parseEther("6"));
        });
    });
});