import { 
    expect, ethers, time, ZeroAddress, 
    MaxUint256, ContractTransactionResponse, 
    Test1155, Test721, Venera, BlockTag } from "./setup";

describe("VeneraAuction", async () => {

    let owner: any
    let acc1: any
    let acc2: any
    let venera: Venera & { deploymentTransaction(): ContractTransactionResponse; }
    
    beforeEach(async function() {
        [ owner, acc1, acc2] = await ethers.getSigners();
        const Venera = await ethers.getContractFactory("Venera");
        venera = await Venera.deploy(owner.address);
    })

    async function getTimestamp(bn: BlockTag | null) {
        if (bn !== null) {
            const block = await ethers.provider.getBlock(bn);
            if (block !== null) {
                return block.timestamp;
            }
        }
        return null;
    }

    describe("ERC721", async () => {
        let test721: Test721 & { deploymentTransaction(): ContractTransactionResponse; }

        beforeEach(async function() {
            const Test = await ethers.getContractFactory("Test721");
            test721 = await Test.deploy(acc1.address);
        })

        async function mint721(
            addr: any,
            count: number
            ) {
            for (let i = -1; i < count; i++) {
                const tokenId = i + 1;
                const tx = await test721.connect(acc1).safeMint(
                    addr.address, `https://www.venera.io/${tokenId}`);
                await tx.wait();
            };
        }

        describe("Auction", async () => {
            it("Should create a auction", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                const tokenId = 1;
                const price = ethers.parseEther("1");
                const duration = 60 * 60 * 24;
                const tx = await venera.connect(acc2).auction(test721.target, tokenId, price, duration);
                await tx.wait();
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                await expect(tx).to.emit(venera, "AuctionCreate").withArgs(
                    events[0].args[0],
                    acc2.address, test721.target, tokenId, price, duration)
                const sale = await venera.getAuc(events[0].args[0]);
                const ts: any = await getTimestamp(tx.blockNumber);
                await expect(sale.nftContract).to.eq(test721.target);
                await expect(sale.tokenId).to.eq(tokenId);
                await expect(sale.price).to.eq(price);
                await expect(sale.endTime).to.eq(ts + duration)
                await expect(sale.highBidder).to.be.eq(ZeroAddress);
                await expect(sale.highBid).to.be.eq(0);

            });

            it("Should create a auctionBatch", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                const tokenId = [1, 2];
                const price = [ethers.parseEther("1"), ethers.parseEther("2")];
                const duration = [60 * 60 * 12, 60 * 60 * 24];
                const tx = await venera.connect(acc2).auctionBatch(test721.target, tokenId, price, duration);
                await tx.wait();
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                for (let i = 0; i < tokenId.length; i++) {
                    const sale = await venera.getAuc(events[i].args[0]);
                    const ts: any = await getTimestamp(tx.blockNumber);
                    await expect(sale.nftContract).to.eq(test721.target);
                    await expect(sale.tokenId).to.eq(tokenId[i]);
                    await expect(sale.price).to.eq(price[i]);
                    await expect(sale.endTime).to.eq(ts + duration[i])
                    await expect(sale.highBidder).to.be.eq(ZeroAddress);
                    await expect(sale.highBid).to.be.eq(0);
                }                
            });       
            
            it("Should handle various auction creation scenarios", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await expect( // Minimum duration error
                    venera.connect(acc2).auction(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 11))
                    .to.be.revertedWith("Invalid duration");
                await expect( // Maximum duration error
                    venera.connect(acc2).auction(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 24 * 366))
                    .to.be.revertedWith("Invalid duration");
                await expect( // Error owner
                    venera.connect(acc1).auction(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12))
                    .to.be.revertedWith("Doesn't own the token");
                await expect( // Error address NFT's smartcontract
                    venera.connect(acc2).auction(ZeroAddress, 1, ethers.parseEther("1"), 60 * 60 * 12))
                    .to.be.revertedWith("Zero address");
                await expect( // Error price
                    venera.connect(acc2).auction(test721.target, 1, 0, 60 * 60 * 12))
                    .to.be.revertedWith("Invalid price");
                await expect( // Error tokenId (duplicate)
                    venera.connect(acc2).auctionBatch(
                        test721.target, [0, 0], 
                        [ethers.parseEther("1"), ethers.parseEther("2")], [60 * 60 * 24, 60 * 60 * 24]))
                    .to.be.revertedWith("Duplicate token found");
            });

            it("Should revert when seller doesn't delegate the token", async () => {
                await mint721(acc2, 10);
                await expect(
                    venera.connect(acc2).auction(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12))
                    .to.be.revertedWith("Token not delegate");
            });

            it("Should revert invalid sales inputs", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await expect(
                    venera.connect(acc2).auctionBatch(
                        test721.target, 
                        [0], // error tokenId 
                        [ethers.parseEther("1"), ethers.parseEther("2")], 
                        [60 * 60 * 24, 60 * 60 * 24]))
                    .to.be.revertedWith("Invalid input");
                await expect(
                    venera.connect(acc2).auctionBatch(
                        test721.target, 
                        [0, 1], 
                        [ethers.parseEther("1")], // error price
                        [60 * 60 * 24, 60 * 60 * 24]))
                    .to.be.revertedWith("Invalid input");
                await expect(
                    venera.connect(acc2).auctionBatch(
                        test721.target, 
                        [0, 1], 
                        [ethers.parseEther("1"), ethers.parseEther("2")], 
                        [60 * 60 * 24])) // error durration
                    .to.be.revertedWith("Invalid input");
            });
        });

        describe("Cancel", async () => {
            it("Should successfully cancel auction after minting tokens", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auction(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate())
                const fine = await venera.getAucFine(events[0].args[0]);
                await expect(fine).to.eq(ethers.parseEther("0.1"));
                await expect(
                    await venera.connect(acc2).cancelAuc(events[0].args[0], {value: fine}))
                    .to.changeEtherBalances([acc2, venera], [-fine, fine]);
            });

            it("Should handle auction creation, cancellation, and bids", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auction(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate())
                const fine = await venera.getAucFine(events[0].args[0]);
                await expect(fine).to.eq(ethers.parseEther("0.1"));
                await expect(
                    venera.connect(acc1).cancelAuc(events[0].args[0], {value: fine}))
                    .to.reverted;
                await venera.connect(owner).bid(events[0].args[0], {value: ethers.parseEther("2")})
                const fine2 = await venera.getAucFine(events[0].args[0]);
                await expect(fine2).to.eq(ethers.parseEther("0.2"));
                await expect(
                    venera.connect(acc2).cancelAuc(events[0].args[0], {value: fine}))
                    .to.reverted;
                await test721.connect(acc2).transferFrom(acc2.address, owner.address, 1);
                await expect(
                    venera.connect(acc2).cancelAuc(events[0].args[0], {value: fine2}))
                    .to.reverted;
            });

            it("Should successfully canceling auction after new bid", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auction(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                await expect(await venera.connect(owner).bid(events[0].args[0], {value: ethers.parseEther("2")}))
                    .to.changeEtherBalances([owner, venera], [-(ethers.parseEther("2")), ethers.parseEther("2")]);
                await expect(await venera.connect(acc1).bid(events[0].args[0], {value: ethers.parseEther("3")}))
                    .to.changeEtherBalances([acc1, owner], [-(ethers.parseEther("3")), ethers.parseEther("2")]);
                const fine = await venera.getAucFine(events[0].args[0]);
                await expect(fine).to.eq(ethers.parseEther("0.3"));
                await expect(
                    await venera.connect(acc2).cancelAuc(
                        events[0].args[0], 
                        {value: fine}))
                    .to.changeEtherBalances([acc2, acc1], [-fine, ethers.parseEther("3")]);
                await expect(await venera.getBalance()).to.eq(fine);
            });

            it("Should handle auction expiration and cancellation after expiration", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auction(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                const fine = await venera.getAucFine(events[0].args[0]);
                await expect(fine).to.eq(ethers.parseEther("0.1"));
                await time.increase(60 * 60 * 13);
                await expect(venera.getAucFine(events[0].args[0]))
                    .to.revertedWith("Auction ended");
                await expect(
                    venera.getAuc(events[0].args[0]))
                    .to.revertedWith("Auction ended");
                await expect(
                    venera.connect(acc2).cancelAuc(events[0].args[0], {value: fine}))
                    .to.revertedWith("Auction ended");
            });

            it("Should revert if querying an ended auction for fine", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auction(test721.target, 1, MaxUint256, 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                await expect(venera.connect(acc2).cancelAuc(events[0].args[0], {value: ethers.parseEther("3")}))
                    .to.reverted;
            });
        });

        describe("Auction End", async () => {
            it("Should complete auction and transfer NFT to highest bidder", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auction(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                await expect(await venera.connect(owner).bid(events[0].args[0], {value: ethers.parseEther("1.1")}))
                    .to.changeEtherBalances([owner, venera], [-(ethers.parseEther("1.1")), ethers.parseEther("1.1")]);
                const tx = await venera.getAuc(events[0].args[0]);
                const price = await venera.getAucPrice(events[0].args[0]);
                await expect(tx.highBidder).to.be.eq(owner.address);
                await expect(price).to.be.eq(ethers.parseEther("1.1"));
                await expect(tx.highBid).to.be.eq(price);
                await expect(await venera.connect(acc1).bid(events[0].args[0], {value: ethers.parseEther("1.2")}))
                    .to.changeEtherBalances([acc1, owner], [-(ethers.parseEther("1.2")), ethers.parseEther("1.1")]);
                const tx2 = await venera.getAuc(events[0].args[0]);
                await expect(tx2.highBidder).to.be.eq(acc1.address);
                const price2 = await venera.getAucPrice(events[0].args[0]);
                await expect(price2).to.be.eq(ethers.parseEther("1.2"));
                await expect(tx2.highBid).to.be.eq(price2);
                await time.increase(60 * 60 * 12);
                await venera.connect(acc1).endAuc(events[0].args[0]);
                const actions = await venera.queryFilter(await venera.filters.AuctionEnded());
                await expect(await test721.ownerOf(1)).to.eq(acc1.address);
                await expect(actions[0].args[0]).to.eq(acc2.address);
                await expect(actions[0].args[1]).to.eq(acc1.address);
                await expect(actions[0].args[2]).to.eq(test721.target);
                await expect(actions[0].args[3]).to.eq(1);
                await expect(actions[0].args[4]).to.eq(ethers.parseEther("1.2"));
            });

            it("Should handle multiple bids and auction expiration", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auction(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                await expect(await venera.connect(owner).bid(events[0].args[0], {value: ethers.parseEther("1.1")}))
                    .to.changeEtherBalances([owner, venera], [-(ethers.parseEther("1.1")), ethers.parseEther("1.1")]);
                await expect(await venera.connect(acc1).bid(events[0].args[0], {value: ethers.parseEther("1.2")}))
                    .to.changeEtherBalances([acc1, owner], [-(ethers.parseEther("1.2")), ethers.parseEther("1.1")]);
                const price = await venera.getAucPrice(events[0].args[0]);
                await expect(price).to.be.eq(ethers.parseEther("1.2"));
                await expect(venera.connect(owner).bid(events[0].args[0], {value: ethers.parseEther("1.2")}))
                    .to.reverted;
                await expect(venera.connect(owner).bid(events[0].args[0], {value: ethers.parseEther("1.1")}))
                    .to.reverted;
                await expect(venera.connect(acc2).bid(events[0].args[0], {value: ethers.parseEther("2")}))
                    .to.reverted;
                await time.increase(60 * 60 * 13);
                await expect(venera.connect(owner).bid(events[0].args[0], {value: ethers.parseEther("1.3")}))
                    .to.revertedWith("Auction ended");
                await expect(venera.getAuc(events[0].args[0])).to.revertedWith("Auction ended");                
            });

            it("Should prevent bidding after auction end", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auction(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                await time.increase(60 * 60 * 13);
                await expect(venera.getAuc(events[0].args[0])).to.revertedWith("Auction ended");
                await expect(venera.connect(acc1).bid(events[0].args[0], {value: ethers.parseEther("3")}))
                    .to.revertedWith("Auction ended");
                await venera.connect(acc2).endAuc(events[0].args[0]);
                await expect(venera.connect(acc1).bid(events[0].args[0], {value: ethers.parseEther("3")}))
                    .to.revertedWith("Auction ended");
            });

            it("Should revert if attempting to bid more than the maximum allowed amount", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auction(test721.target, 1, MaxUint256, 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                await expect(venera.connect(acc1).bid(events[0].args[0], {value: ethers.parseEther("3")}))
                    .to.reverted
            });
        });
    });

    describe("ERC1155", async () => {
        let test1155: Test1155 & { deploymentTransaction(): ContractTransactionResponse; }

        beforeEach(async function() {
            const Test1155 = await ethers.getContractFactory("Test1155");
            test1155 = await Test1155.deploy(acc1.address);
        })

        async function mint1155(
            addr: any,
            count: number,
            amount: number
        ) {
            for (let i = -1; i < count; i++) {
                const tokenId = i + 1;
                const tx = await test1155.connect(acc1).mint(
                    addr.address, tokenId, amount, "0x");
                await tx.wait();
            }
        }

        describe("Auction", async () => {
            it("Should create a auctionMulti", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                const tokenId = 1;
                const quantity = 2
                const price = ethers.parseEther("1");
                const duration = 60 * 60 * 24;
                const tx = await venera.connect(acc2).auctionMulti(test1155.target, tokenId, quantity, price, duration);
                await tx.wait();
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                for(let i = 0; i < quantity; i++) {
                    const sale = await venera.getAuc(events[i].args[0]);
                    const ts: any = await getTimestamp(tx.blockNumber);
                    await expect(sale.nftContract).to.eq(test1155.target);
                    await expect(sale.tokenId).to.eq(tokenId);
                    await expect(sale.price).to.eq(price);
                    await expect(sale.endTime).to.eq(ts + duration)
                    await expect(sale.startTime).to.be.eq(ts);
                    await expect(sale.highBidder).to.be.eq(ZeroAddress);
                    await expect(sale.highBid).to.be.eq(0);
                }
            });

            it("Should create a saleMultiBatch", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                const tokenId = [1, 2];
                const quantity = [2, 3]
                const price = [ethers.parseEther("1"), ethers.parseEther("2")];
                const duration = [60 * 60 * 12, 60 * 60 * 24];
                const tx = await venera.connect(acc2).auctionMultiBatch(test1155.target, tokenId, quantity, price, duration);
                await tx.wait();
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                let k = 0;
                for(let i = 0; i < tokenId.length; i++) {
                    for(let j = 0; j < quantity[i]; j++) {
                        const sale = await venera.getAuc(events[k].args[0]);
                        const ts: any = await getTimestamp(tx.blockNumber);
                        await expect(sale.nftContract).to.eq(test1155.target);
                        await expect(sale.tokenId).to.eq(tokenId[i]);
                        await expect(sale.price).to.eq(price[i]);
                        await expect(sale.endTime).to.eq(ts + duration[i])
                        await expect(sale.startTime).to.be.eq(ts);
                        await expect(sale.highBidder).to.be.eq(ZeroAddress);
                        await expect(sale.highBid).to.be.eq(0);
                        k++;
                    }
                }
            });

            it("Should validate auction parameters and token ownership for multiple NFTs", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await expect( // Minimum duration error
                    venera.connect(acc2).auctionMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 11))
                    .to.be.revertedWith("Invalid duration");
                await expect( // Maximum duration error
                    venera.connect(acc2).auctionMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 24 * 366))
                    .to.be.revertedWith("Invalid duration");
                await test1155.connect(acc1).setApprovalForAll(venera.target, true);
                await expect( // Error owner
                    venera.connect(acc1).auctionMulti(test1155.target, 1, 2, ethers.parseEther("1"), 60 * 60 * 12))
                    .to.be.revertedWith("Doesn't own enough tokens");
                await expect( // Error address NFT's cmartcontract
                    venera.connect(acc2).auctionMulti(ZeroAddress, 1, 1, ethers.parseEther("1"), 60 * 60 * 12))
                    .to.be.revertedWith("Zero address");
                await expect( // Error price
                    venera.connect(acc2).auctionMulti(test1155.target, 1, 1, 0, 60 * 60 * 12))
                    .to.be.revertedWith("Invalid price");
                await expect( // Error quantity
                    venera.connect(acc2).auctionMulti(test1155.target, 1, 0, ethers.parseEther("1"), 60 * 60 * 24))
                    .to.be.revertedWith("Invalid quantity");
                await expect( // Error tokenId (duplacate)
                    venera.connect(acc2).auctionMultiBatch(test1155.target, [0, 0], [1, 1], 
                        [ethers.parseEther("1"), ethers.parseEther("2")], [60 * 60 * 24, 60 * 60 * 24]))
                    .to.be.revertedWith("Duplicate token found");
            });

            it("Should revert when seller doesn't delegate the token", async () => {
                await mint1155(acc2, 10, 10);
                await expect(
                    venera.connect(acc2).auctionMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12))
                    .to.be.revertedWith("Token not delegate");
            });

            it("Should revert invalid sales inputs", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await expect(
                    venera.connect(acc2).auctionMultiBatch(
                        test1155.target, 
                        [0], // error tokenId 
                        [1, 2],
                        [ethers.parseEther("1"), ethers.parseEther("2")], 
                        [60 * 60 * 24, 60 * 60 * 24]))
                    .to.be.revertedWith("Invalid input");
                await expect(
                    venera.connect(acc2).auctionMultiBatch(
                        test1155.target, 
                        [0, 1], 
                        [1], // error quantity
                        [ethers.parseEther("1"), ethers.parseEther("2")], 
                        [60 * 60 * 24])) 
                    .to.be.revertedWith("Invalid input");
                await expect(
                    venera.connect(acc2).auctionMultiBatch(
                        test1155.target, 
                        [0, 1], 
                        [1, 2],
                        [ethers.parseEther("1")], // error price
                        [60 * 60 * 24, 60 * 60 * 24]))
                    .to.be.revertedWith("Invalid input");
                await expect(
                    venera.connect(acc2).auctionMultiBatch(
                        test1155.target, 
                        [0, 1], 
                        [1, 2],
                        [ethers.parseEther("1"), ethers.parseEther("2")], 
                        [60 * 60 * 24])) // error durration
                    .to.be.revertedWith("Invalid input");
            });

            it("Should test with ended auction", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auctionMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12)
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                await time.increase(60 * 60 * 13);
                await expect(venera.getAuc(events[0].args[0])).to.revertedWith("Auction ended");
            });
        });

        describe("Cancel", async () => {
            it("Should successfully cancel auctionMulti after minting tokens", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auctionMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate())
                const fine = await venera.getAucFine(events[0].args[0]);
                await expect(fine).to.eq(ethers.parseEther("0.1"));
                await expect(
                    await venera.connect(acc2).cancelAuc(
                        events[0].args[0], 
                        {value: fine}))
                    .to.changeEtherBalances([acc2, venera], [-fine, fine]);
            });

            it("Should validate auction lifecycle and cancellation with multiple ERC1155 tokens", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auctionMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate())
                const fine = await venera.getAucFine(events[0].args[0]);
                await expect(fine).to.eq(ethers.parseEther("0.1"));
                await expect(
                    venera.connect(acc1).cancelAuc(events[0].args[0], {value: fine}))
                    .to.reverted;
                await expect(await venera.connect(owner).bid(events[0].args[0], {value: ethers.parseEther("2")}))
                    .to.changeEtherBalances([owner, venera], [-(ethers.parseEther("2")), ethers.parseEther("2")]);
                await expect(
                    venera.connect(acc2).cancelAuc(events[0].args[0], {value: fine}))
                    .to.reverted;
                await expect(await venera.connect(acc1).bid(events[0].args[0], {value: ethers.parseEther("3")}))
                    .to.changeEtherBalances([acc1, owner], [-(ethers.parseEther("3")), ethers.parseEther("2")]);
                const fine2 = await venera.getAucFine(events[0].args[0]);
                await expect(fine2).to.eq(ethers.parseEther("0.3"));
                await expect(
                    venera.connect(acc2).cancelAuc(
                        events[0].args[0], 
                        {value: fine2})).to.changeEtherBalances([acc2, acc1], [-fine2, ethers.parseEther("3")]);
                await expect(await venera.getBalance()).to.eq(fine2);
                await expect(
                    venera.connect(acc2).cancelAuc(events[0].args[0], {value: fine2}))
                    .to.revertedWith("Auction ended")
                await expect(venera.getAucFine(events[0].args[0]))
                    .to.revertedWith("Auction ended")
            });

            it("Should revert canceling auctionMulti after transferring token ownership", async () => {
                await mint1155(acc2, 10, 1);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auctionMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                const fine = await venera.getAucFine(events[0].args[0]);
                await test1155.connect(acc2).safeTransferFrom(acc2.address, owner.address, 1, 1, "0x");
                await expect(
                    venera.connect(acc2).cancelAuc(events[0].args[0], {value: fine}))
                    .to.reverted;
            });

            it("Should revert if querying an ended auction for fine", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auctionMulti(test1155.target, 1, 1, MaxUint256, 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                await expect(venera.connect(acc2).cancelAuc(events[0].args[0], {value: ethers.parseEther("3")}))
                    .to.reverted;
            });
        });

        describe("Auction End", async () => {
            it("Should complete auction and transfer NFT to highest bidder", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auctionMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                await expect(await venera.connect(owner).bid(events[0].args[0], {value: ethers.parseEther("1.1")}))
                    .to.changeEtherBalances([owner, venera], [-(ethers.parseEther("1.1")), ethers.parseEther("1.1")]);
                const tx = await venera.getAuc(events[0].args[0]);
                await expect(tx.highBidder).to.be.eq(owner.address);
                await expect(tx.highBid).to.be.eq(ethers.parseEther("1.1"));
                await expect(await venera.connect(acc1).bid(events[0].args[0], {value: ethers.parseEther("1.2")}))
                    .to.changeEtherBalances([acc1, owner], [-(ethers.parseEther("1.2")), ethers.parseEther("1.1")]);
                const tx2 = await venera.getAuc(events[0].args[0]);
                await expect(tx2.highBidder).to.be.eq(acc1.address);
                await expect(tx2.highBid).to.be.eq(ethers.parseEther("1.2"));
                await time.increase(60 * 60 * 12);
                await venera.connect(acc1).endAuc(events[0].args[0]);
                const actions = await venera.queryFilter(await venera.filters.AuctionEnded());
                await expect(await test1155.balanceOf(acc1.address, 1)).to.eq(1);
                await expect(actions[0].args[0]).to.eq(acc2.address);
                await expect(actions[0].args[1]).to.eq(acc1.address);
                await expect(actions[0].args[2]).to.eq(test1155.target);
                await expect(actions[0].args[3]).to.eq(1);
                await expect(actions[0].args[4]).to.eq(ethers.parseEther("1.2"));
            });

            it("Should validate bid handling and auction end for ERC1155 tokens", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auctionMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                await expect(await venera.connect(owner).bid(events[0].args[0], {value: ethers.parseEther("1.1")}))
                    .to.changeEtherBalances([owner, venera], [-(ethers.parseEther("1.1")), ethers.parseEther("1.1")]);
                await expect(await venera.connect(acc1).bid(events[0].args[0], {value: ethers.parseEther("1.2")}))
                    .to.changeEtherBalances([acc1, owner], [-(ethers.parseEther("1.2")), ethers.parseEther("1.1")]);
                await expect(venera.connect(owner).bid(events[0].args[0], {value: ethers.parseEther("1")}))
                    .to.reverted;
                await expect(venera.connect(owner).bid(events[0].args[0], {value: ethers.parseEther("1.1")}))
                    .to.reverted;
                await expect(venera.connect(acc2).bid(events[0].args[0], {value: ethers.parseEther("2")}))
                    .to.reverted;
                await time.increase(60 * 60 * 13);
                await expect(venera.connect(owner).bid(events[0].args[0], {value: ethers.parseEther("1.3")}))
                    .to.revertedWith("Auction ended");
                await venera.connect(acc2).endAuc(events[0].args[0]);
                await expect(venera.getAuc(events[0].args[0])).to.revertedWith("Auction ended");
            });

            it("Should revert if attempting to bid more than the maximum allowed amount", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).auctionMulti(test1155.target, 1, 1, MaxUint256, 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.AuctionCreate());
                await expect(venera.connect(acc1).bid(events[0].args[0], {value: ethers.parseEther("3")}))
                    .to.reverted
            });
        });
    });
});
