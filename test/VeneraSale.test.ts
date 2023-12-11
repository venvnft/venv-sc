import { 
    expect, ethers, time, ZeroAddress, 
    BlockTag, MaxUint256, ContractTransactionResponse, 
    Test1155, Test721, Venera } from "./setup";

describe("VeneraSale", async () => {

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

        describe("Sale", async () => {

            it("Should create a sale", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                const tokenId = 1;
                const price = ethers.parseEther("1");
                const duration = 60 * 60 * 24;
                const tx = await venera.connect(acc2).sell(test721.target, tokenId, price, duration);
                await tx.wait();
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                await expect(tx).to.emit(venera, "SaleCreate").withArgs(
                    events[0].args[0],
                    acc2.address, test721.target, tokenId, price, duration)
                const sale = await venera.getSale(events[0].args[0]);
                const ts: any = await getTimestamp(tx.blockNumber);
                await expect(sale.nftContract).to.eq(test721.target);
                await expect(sale.tokenId).to.eq(tokenId);
                await expect(sale.price).to.eq(price);
                await expect(sale.endTime).to.eq(ts + duration)
                await expect(sale.startTime).to.be.eq(ts);
            });

            it("Should create a saleBatch", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                const tokenId = [1, 2];
                const price = [ethers.parseEther("1"), ethers.parseEther("2")];
                const duration = [60 * 60 * 24, 60 * 60 * 24];
                const tx = await venera.connect(acc2).sellBatch(test721.target, tokenId, price, duration);
                await tx.wait();
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                for(let i = 0; i < tokenId.length; i++) {
                    const sale = await venera.getSale(events[i].args[0]);
                    const ts: any = await getTimestamp(tx.blockNumber);
                    await expect(sale.nftContract).to.eq(test721.target);
                    await expect(sale.tokenId).to.eq(tokenId[i]);
                    await expect(sale.price).to.eq(price[i]);
                    await expect(sale.endTime).to.eq(ts + duration[i])
                    await expect(sale.startTime).to.be.eq(ts);
                }
            });

            it("Should handle sale creation errors", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await expect( // Minimum duration error
                    venera.connect(acc2).sell(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 11))
                    .to.be.revertedWith("Invalid duration");
                await expect( // Maximum duration error
                    venera.connect(acc2).sell(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 24 * 366))
                    .to.be.revertedWith("Invalid duration");
                await expect( // Error owner
                    venera.connect(acc1).sell(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12))
                    .to.be.revertedWith("Doesn't own the token");
                await expect( // Error address NFT's snartcontract
                    venera.connect(acc2).sell(
                        ZeroAddress, 1, ethers.parseEther("1"), 60 * 60 * 12))
                    .to.be.revertedWith("Zero address");
                await expect( // Error price
                    venera.connect(acc2).sell(test721.target, 1, 0, 60 * 60 * 12))
                    .to.be.revertedWith("Invalid price");
                await expect( // Error tokenId (duplicate)
                    venera.connect(acc2).sellBatch(
                        test721.target, 
                        [0, 0],
                        [ethers.parseEther("1"), ethers.parseEther("2")], 
                        [60 * 60 * 24, 60 * 60 * 24]))
                    .to.be.revertedWith("Duplicate token found");
            });

            it("Should revert when seller doesn't delegate the token", async () => {
                await mint721(acc2, 10);
                await expect(
                    venera.connect(acc2).sell(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12))
                    .to.be.revertedWith("Token not delegate");
            });

            it("Should revert invalid sales inputs", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await expect(
                    venera.connect(acc2).sellBatch(
                        test721.target, 
                        [0], // error tokenId 
                        [ethers.parseEther("1"), ethers.parseEther("2")], 
                        [60 * 60 * 24, 60 * 60 * 24]))
                    .to.be.revertedWith("Invalid input");
                await expect(
                    venera.connect(acc2).sellBatch(
                        test721.target, 
                        [0, 1], 
                        [ethers.parseEther("1")], // error price
                        [60 * 60 * 24, 60 * 60 * 24]))
                    .to.be.revertedWith("Invalid input");
                await expect(
                    venera.connect(acc2).sellBatch(
                        test721.target, 
                        [0, 1], 
                        [ethers.parseEther("1"), ethers.parseEther("2")], 
                        [60 * 60 * 24])) // error durration
                    .to.be.revertedWith("Invalid input");
            });

            it("Should test with ended sale", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sell(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                await time.increase(60 * 60 * 13);
                await expect(venera.getPrice(events[0].args[0])).to.revertedWith("Sale ended");
                await expect(venera.getSale(events[0].args[0])).to.revertedWith("Sale ended");
            });

            it("Should handle multiple users creating sales simultaneously", async () => {
                await mint721(acc2, 10);
                const createSalePromises = [];
                const users = [acc1, acc2 , owner];
                await test721.connect(acc2).transferFrom(acc2.address, acc1.address, 0);
                await test721.connect(acc2).transferFrom(acc2.address, owner.address, 2);
                for (let i = 0; i < users.length; i++) {
                    await test721.connect(users[i]).setApprovalForAll(venera.target, true);
                    createSalePromises.push(
                        venera.connect(users[i]).sell(
                            test721.target, i, ethers.parseEther(`${1 + i}`), 60 * 60 * 24));
                }
                await Promise.all(createSalePromises);
                for (let i = 0; i < users.length; i++) {
                    const events = await venera.queryFilter(await venera.filters.SaleCreate());
                    const sale = await venera.getSale(events[i].args[0]);
                    await expect(sale.nftContract).to.eq(test721.target);
                    await expect(sale.tokenId).to.eq(i);
                    await expect(sale.seller).to.eq(users[i].address);
                    await expect(sale.price).to.eq( ethers.parseEther(`${1 + i}`));
                }
            });

            it("Should handle extreme input values", async () => {
                await mint721(acc2, 10);
                const prices = [ethers.MaxUint256, 1];
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                for (let i = 0; i < prices.length; i++) {
                    await venera.connect(acc2).sell(test721.target, i, prices[i], 60 * 60 * 24);
                    const events = await venera.queryFilter(await venera.filters.SaleCreate());
                    const sale = await venera.getSale(events[i].args[0]);
                    await expect(sale.nftContract).to.eq(test721.target);
                    await expect(sale.tokenId).to.eq(i);
                    await expect(sale.price).to.eq(prices[i]);
                }         
            });
        });

        describe("Cancel", async () => {
            it("Should successfully cancel sale after minting tokens", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sell(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate())
                const fine = await venera.getFine(events[0].args[0]);
                await expect(fine).to.eq(ethers.parseEther("0.1"));
                await expect(await venera.connect(acc2).cancel(events[0].args[0], {value: fine}))
                    .to.changeEtherBalances([acc2, venera], [-fine, fine]);
            });

            it("Should not cancel sale after transferring NFT ownership", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sell(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate())
                const fine = await venera.getFine(events[0].args[0]);
                await expect(fine).to.eq(ethers.parseEther("0.1"));
                await expect(venera.connect(acc1).cancel(events[0].args[0], {value: fine}))
                    .to.reverted;
                await test721.connect(acc2).transferFrom(acc2.address, owner.address, 1);
                await expect(venera.connect(acc2).cancel(events[0].args[0], {value: fine}))
                    .to.reverted;
            });

            it("Should revert canceling sale after token purchase", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sell(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate())
                const fine = await venera.getFine(events[0].args[0]);
                await expect(fine).to.eq(ethers.parseEther("0.1"));
                const price = await venera.getPrice(events[0].args[0]);
                await expect(price).to.eq(ethers.parseEther("1"));
                await venera.connect(owner).buy(events[0].args[0], {value: price})
                await expect(venera.connect(acc2).cancel(events[0].args[0], {value: fine}))
                    .to.reverted;
            });

            it("Should cancel with ended sale", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sell(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                const fine = await venera.getFine(events[0].args[0]);
                await expect(fine).to.eq(ethers.parseEther("0.1"));
                await time.increase(60 * 60 * 13);
                await expect(venera.getFine(events[0].args[0])).to.revertedWith("Sale ended");
                await expect(venera.connect(acc2).cancel(events[0].args[0], {value: fine}))
                    .to.revertedWith("Sale ended")
                await expect(venera.connect(acc2).cancel(events[0].args[0], { value: fine }))
                    .to.be.reverted;
            });

            it("Should revert if canceling a sale with insufficient value for fine", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sell(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                await expect(await venera.getFine(events[0].args[0])).to.eq(ethers.parseEther("0.1"));
                await expect(venera.connect(acc2).cancel(events[0].args[0], {value: ethers.parseEther("0.01")}))
                    .to.reverted;
            });

            it("Should revert if querying an ended sale for fine", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sell(test721.target, 1, MaxUint256, 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                await expect(venera.connect(acc2).cancel(events[0].args[0], {value: ethers.parseEther("3")}))
                    .to.reverted;
            });
        });

        describe("Buy", async () => {
            it("Should buy a token successfully", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sell(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate())
                const price = await venera.getPrice(events[0].args[0]);
                await expect(price).to.eq(ethers.parseEther("1"));
                const tx = await venera.connect(acc1).buy(events[0].args[0], {value: price});
                await tx.wait();
                const ts = await getTimestamp(tx.blockNumber);
                await expect(await test721.ownerOf(1)).to.eq(acc1.address);
                await expect(await venera.getBalance()).to.eq(ethers.parseEther("0.01"));
                await expect(tx).to.changeEtherBalances([acc1, acc2], [-price, ethers.parseEther("0.99")]);
                await expect(tx).to.emit(venera, "SaleEnded").withArgs(
                    acc2.address, acc1.address, test721.target, 1, price, ts)
            });

            it("Should reject double purchase attempt after a successful purchase", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sell(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate())
                const price = await venera.getPrice(events[0].args[0]);
                await expect(price).to.eq(ethers.parseEther("1"));
                const tx = await venera.connect(acc1).buy(events[0].args[0], {value: price});
                await tx.wait();
                await expect(venera.connect(owner).buy(events[0].args[0], {value: price}))
                    .to.revertedWith("Sale ended");
            });

            it("Should prevent buying after transfer", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sell(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate())
                const price = await venera.getPrice(events[0].args[0]);
                await expect(price).to.eq(ethers.parseEther("1"));
                await expect(venera.connect(acc2).buy(events[0].args[0], {value: price}))
                    .to.reverted;
                await test721.connect(acc2).transferFrom(acc2.address, owner.address, 1);
                await expect(venera.connect(acc1).buy(events[0].args[0], {value: price}))
                    .to.reverted;
            });

            it("Should reject purchase due to insufficient balance for high-value token", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sell(test721.target, 1, ethers.parseEther("10000"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate())
                await expect(venera.connect(acc1).buy(events[0].args[0]))
                    .to.reverted;
            });

            it("Should manage multiple users buying the same token", async () => {
                await mint721(acc2, 10);
                const buyPromises = [];
                const buyers = [acc1, owner];
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sellBatch(
                    test721.target, 
                    [0, 1], 
                    [ethers.parseEther("1"), ethers.parseEther("2")], 
                    [60 * 60 * 24, 60 * 60 * 24]);
                for (let i = 0; i < buyers.length; i++) {
                    const events = await venera.queryFilter(await venera.filters.SaleCreate());
                    const price = await venera.getPrice(events[i].args[0]);
                    buyPromises.push(venera.connect(buyers[i]).buy(events[i].args[0], { value: price }));
                }
                await Promise.all(buyPromises);
                for (let i = 0; i < buyers.length; i++) {
                    await expect(await test721.ownerOf(i)).to.eq(buyers[i].address);
                }
            });

            it("Should manage edge cases during sale periods", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sell(test721.target, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                await time.increase(60 * 60 * 12);
                await expect(venera.connect(owner).buy(events[0].args[0], { value: ethers.parseEther("1") }))
                    .to.be.revertedWith("Sale ended");
            });

            it("Should revert if buying with insufficient funds", async () => {
                await mint721(acc2, 10);
                await test721.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sell(test721.target, 1, ethers.parseEther("2"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                await expect(venera.connect(acc1).buy(events[0].args[0], { value: ethers.parseEther("1") }))
                    .to.be.reverted;
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
            addr: { address: any; },
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

        describe("Sale", async () => {

            it("Should create a saleMulti", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                const tokenId = 1;
                const quantity = 2;
                const price = ethers.parseEther("1");
                const duration = 60 * 60 * 24;
                const tx = await venera.connect(acc2).sellMulti(test1155.target, tokenId, quantity, price, duration);
                await tx.wait();
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                for(let i = 0; i < quantity; i++) {
                    const sale = await venera.getSale(events[i].args[0]);
                    const ts: any = await getTimestamp(tx.blockNumber);
                    await expect(sale.nftContract).to.eq(test1155.target);
                    await expect(sale.tokenId).to.eq(tokenId);
                    await expect(sale.price).to.eq(price);
                    await expect(sale.endTime).to.eq(ts + duration)
                    await expect(sale.startTime).to.be.eq(ts);
                }
            });

            it("Should create a saleMultiBatch", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                const tokenId = [1, 2];
                const quantity = [2, 3]
                const price = [ethers.parseEther("1"), ethers.parseEther("2")];
                const duration = [60 * 60 * 12, 60 * 60 * 24];
                const tx = await venera.connect(acc2).sellMultiBatch(test1155.target, tokenId, quantity, price, duration);
                await tx.wait();
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                let k = 0;
                for(let i = 0; i < tokenId.length; i++) {
                    for(let j = 0; j < quantity[i]; j++) {
                        const sale = await venera.getSale(events[k].args[0]);
                        const ts: any = await getTimestamp(tx.blockNumber);
                        await expect(sale.nftContract).to.eq(test1155.target);
                        await expect(sale.tokenId).to.eq(tokenId[i]);
                        await expect(sale.price).to.eq(price[i]);
                        await expect(sale.endTime).to.eq(ts + duration[i])
                        await expect(sale.startTime).to.be.eq(ts);
                        k++;
                    }
                }
            });

            it("Should validate batch sale creation", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await expect( // Minimum duration error
                    venera.connect(acc2).sellMulti(test1155.target, 1, 2, ethers.parseEther("1"), 60 * 60 * 11))
                    .to.be.revertedWith("Invalid duration");
                await expect( // Maximum duration error
                    venera.connect(acc2).sellMulti(test1155.target, 1, 2, ethers.parseEther("1"), 60 * 60 * 24 * 366))
                    .to.be.revertedWith("Invalid duration");
                await expect( // Error owner
                    venera.connect(acc1).sellMulti(test1155.target, 1, 2, ethers.parseEther("1"), 60 * 60 * 12))
                    .to.be.revertedWith("Doesn't own enough tokens");
                await expect( // Error address NFT's smartcontract
                    venera.connect(acc2).sellMulti(ZeroAddress, 1, 1, ethers.parseEther("1"), 60 * 60 * 12))
                    .to.be.revertedWith("Zero address");
                await expect( // Error price 
                    venera.connect(acc2).sellMulti(test1155.target, 1, 1, 0, 60 * 60 * 12))
                    .to.be.revertedWith("Invalid price");
                await expect( // Error tokenId (duplicate) 
                    venera.connect(acc2).sellMultiBatch(test1155.target, [0, 0], [1, 1],
                        [ethers.parseEther("1"), ethers.parseEther("2")], [60 * 60 * 24, 60 * 60 * 24]))
                    .to.be.revertedWith("Duplicate token found");
                await expect( // Error quantity
                venera.connect(acc2).sellMulti(test1155.target, 1, 0,
                    ethers.parseEther("1"), 60 * 60 * 24))
                .to.be.revertedWith("Invalid quantity");
            });

            it("Should revert when seller doesn't delegate the token", async () => {
                await mint1155(acc2, 10, 10);
                await expect(
                    venera.connect(acc2).sellMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12))
                    .to.be.revertedWith("Token not delegate");
            });

            it("Should revert invalid sales inputs", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await expect(
                    venera.connect(acc2).sellMultiBatch(
                        test1155.target, 
                        [0], // error tokenId 
                        [1, 2],
                        [ethers.parseEther("1"), ethers.parseEther("2")], 
                        [60 * 60 * 24, 60 * 60 * 24]))
                    .to.be.revertedWith("Invalid input");
                await expect(
                    venera.connect(acc2).sellMultiBatch(
                        test1155.target, 
                        [0, 1], 
                        [1], // error quantity
                        [ethers.parseEther("1"), ethers.parseEther("2")], 
                        [60 * 60 * 24])) 
                    .to.be.revertedWith("Invalid input");
                await expect(
                    venera.connect(acc2).sellMultiBatch(
                        test1155.target, 
                        [0, 1], 
                        [1, 2],
                        [ethers.parseEther("1")], // error price
                        [60 * 60 * 24, 60 * 60 * 24]))
                    .to.be.revertedWith("Invalid input");
                await expect(
                    venera.connect(acc2).sellMultiBatch(
                        test1155.target, 
                        [0, 1], 
                        [1, 2],
                        [ethers.parseEther("1"), ethers.parseEther("2")], 
                        [60 * 60 * 24])) // error durration
                    .to.be.revertedWith("Invalid input");
            });

            it("Should test with ended sale", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sellMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12)
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                await time.increase(60 * 60 * 13);
                await expect(venera.getPrice(events[0].args[0])).to.rejectedWith("Sale ended");
                await expect(venera.getSale(events[0].args[0])).to.revertedWith("Sale ended");
            });

            it("Should handle multiple users creating sales simultaneously", async () => {
                await mint1155(acc2, 10, 10);
                const createSalePromises = [];
                const users = [acc1, acc2 , owner];
                await test1155.connect(acc2).safeTransferFrom(acc2.address, acc1.address, 0, 1, "0x");
                await test1155.connect(acc2).safeTransferFrom(acc2.address, owner.address, 2, 1, "0x");
                for (let i = 0; i < users.length; i++) {
                    await test1155.connect(users[i]).setApprovalForAll(venera.target, true);
                    createSalePromises.push(
                        venera.connect(users[i]).sellMulti(
                            test1155.target, i, 1, ethers.parseEther(`${1 + i}`), 60 * 60 * 24));
                }
                await Promise.all(createSalePromises);
                for (let i = 0; i < users.length; i++) {
                    const events = await venera.queryFilter(await venera.filters.SaleCreate());
                    const sale = await venera.getSale(events[i].args[0]);
                    await expect(sale.nftContract).to.eq(test1155.target);
                    await expect(sale.tokenId).to.eq(i);
                    await expect(sale.seller).to.eq(users[i].address);
                    await expect(sale.price).to.eq( ethers.parseEther(`${1 + i}`));
                }
            });

            it("Should handle extreme input values", async () => {
                await mint1155(acc2, 10, 10);
                const prices = [ethers.MaxUint256, 1];
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                for (let i = 0; i < prices.length; i++) {
                    await venera.connect(acc2).sellMulti(
                        test1155.target, i, 1, prices[i], 60 * 60 * 24);                    
                    const events = await venera.queryFilter(await venera.filters.SaleCreate());
                    const sale = await venera.getSale(events[i].args[0]);
                    await expect(sale.nftContract).to.eq(test1155.target);
                    await expect(sale.tokenId).to.eq(i);
                    await expect(sale.price).to.eq(prices[i]);
                }         
            });
        });

        describe("Cancel", async () => {
            it("Should successfully cancel sale after minting tokens", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sellMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate())
                const fine = await venera.getFine(events[0].args[0]);
                await expect(fine).to.eq(ethers.parseEther("0.1"));
                await expect(
                    await venera.connect(acc2).cancel(events[0].args[0], {value: fine}))
                    .to.changeEtherBalances([acc2, venera], [-fine, fine]);
            });

            it("Should validate batch sale cancellation", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sellMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate())
                const fine = await venera.getFine(events[0].args[0]);
                await expect(fine).to.eq(ethers.parseEther("0.1"));
                await expect(venera.connect(acc1).cancel(events[0].args[0], {value: fine}))
                    .to.reverted;
                await expect(venera.connect(acc2).cancel(events[0].args[0], {value: ethers.parseEther("0.01")}))
                    .to.reverted;
                await venera.connect(acc2).cancel(events[0].args[0], { value: fine });     
                await expect(venera.connect(acc2).cancel(events[0].args[0], { value: fine }))
                    .to.be.reverted;
            });

            it("Should revert canceling sale after transferring token ownership", async () => {
                await mint1155(acc2, 10, 1);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sellMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                const fine = await venera.getFine(events[0].args[0]);
                await test1155.connect(acc2).safeTransferFrom(acc2.address, owner.address, 1, 1, "0x");
                await expect(venera.connect(acc2).cancel(events[0].args[0], {value: fine}))
                    .to.reverted;
            });

            it("Should revert canceling sale after token purchase", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sellMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate())
                const fine = await venera.getFine(events[0].args[0]);
                await expect(fine).to.eq(ethers.parseEther("0.1"));
                const price = await venera.getPrice(events[0].args[0]);
                await expect(price).to.eq(ethers.parseEther("1"));
                await venera.connect(owner).buy(events[0].args[0], {value: price})
                await expect(venera.connect(acc2).cancel(events[0].args[0], {value: fine}))
                    .to.reverted;
            });

            it("Should cancel with ended sale", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sellMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                const fine = await venera.getFine(events[0].args[0]);
                await expect(fine).to.eq(ethers.parseEther("0.1"));
                await time.increase(60 * 60 * 13);
                await expect(venera.getFine(events[0].args[0])).to.revertedWith("Sale ended");
                await expect(venera.getSale(events[0].args[0])).to.revertedWith("Sale ended");
                await expect(venera.connect(acc2).cancel(events[0].args[0],{value: fine}))
                    .to.revertedWith("Sale ended")
            });

            it("Should revert if querying an ended sale for fine", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sellMulti(test1155.target, 1, 1, MaxUint256, 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                await expect(venera.connect(acc2).cancel(events[0].args[0], {value: ethers.parseEther("3")}))
                    .to.reverted;
            });
        });

        describe("Buy", async () => {
            it("Should buy a token successfully", async () => {
                await mint1155(acc2, 10, 1);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sellMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate())
                const price = await venera.getPrice(events[0].args[0]);
                await expect(price).to.eq(ethers.parseEther("1"));
                const tx = await venera.connect(acc1).buy(events[0].args[0], {value: price});
                await tx.wait();
                const ts = await getTimestamp(tx.blockNumber);
                await expect(await test1155.balanceOf(acc1.address, 1)).to.eq(1)
                await expect(await test1155.balanceOf(acc2.address, 1)).to.eq(0)
                await expect(await venera.getBalance()).to.eq(ethers.parseEther("0.01"));
                await expect(tx).to.changeEtherBalances([acc1, acc2], [-price, ethers.parseEther("0.99")]);
                await expect(tx).to.emit(venera, "SaleEnded").withArgs(
                    acc2.address, acc1.address, test1155.target, 1, price, ts)
            });

            it("Should prevent purchase of ERC1155 token from multi sale", async () => {
                await mint1155(acc2, 10, 1);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sellMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate())
                const price = await venera.getPrice(events[0].args[0]);
                await expect(price).to.eq(ethers.parseEther("1"));
                await expect(venera.connect(acc2).buy(events[0].args[0], {value: price}))
                    .to.reverted;
                await test1155.connect(acc2).safeTransferFrom(acc2.address, owner.address, 1, 1, "0x");
                await expect(venera.connect(acc1).buy(events[0].args[0], {value: price}))
                    .to.reverted;
            });

            it("Should manage multiple users buying the same token", async () => {
                await mint1155(acc2, 10, 1);
                const buyPromises = [];
                const buyers = [acc1, owner];
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sellMultiBatch(
                    test1155.target, [0, 1], [1, 1], 
                    [ethers.parseEther("1"), ethers.parseEther("2")], [60 * 60 * 24, 60 * 60 * 24]);
                for (let i = 0; i < buyers.length; i++) {
                    const events = await venera.queryFilter(await venera.filters.SaleCreate());
                    const price = await venera.getPrice(events[i].args[0]);
                    buyPromises.push(venera.connect(buyers[i]).buy(events[i].args[0], { value: price }));
                }
                await Promise.all(buyPromises);
                for (let i = 0; i < buyers.length; i++) {
                    await expect(await test1155.balanceOf(buyers[i].address, i)).to.eq(1);
                }
            });

            it("Should end ERC1155 sale after duration and prevent purchase", async () => {
                await mint1155(acc2, 10, 1);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sellMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                await time.increase(60 * 60 * 13);
                await expect(venera.getPrice(events[0].args[0])).to.be.revertedWith("Sale ended");
                await expect(venera.getSale(events[0].args[0])).to.be.revertedWith("Sale ended");
                await expect(venera.connect(owner).buy(events[0].args[0], {value: ethers.parseEther("1")}))
                    .to.be.revertedWith("Sale ended");
            });

            it("Should prevent creating new sale when previous sale exists", async () => {
                await mint1155(acc2, 10, 1);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                const tx = await venera.connect(acc2).sellMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12);
                await tx.wait();
                const tx2 = await venera.connect(acc2).sellMulti(test1155.target, 1, 1, ethers.parseEther("1"), 60 * 60 * 12);
                await tx2.wait();
                const events = await venera.queryFilter(await venera.filters.SaleCreate())
                await venera.connect(acc1).buy(events[0].args[0], {value: ethers.parseEther("1")});
                await expect(venera.connect(acc1).buy(events[1].args[0], {value: ethers.parseEther("1")}))
                    .to.revertedWith("Sale ended")
                await expect(venera.connect(owner).buy(events[0].args[0], {value: ethers.parseEther("1")}))
                    .to.revertedWith("Sale ended");
            });

            it("Should revert if buying with insufficient funds", async () => {
                await mint1155(acc2, 10, 10);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sellMulti(test1155.target, 1, 1, ethers.parseEther("2"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate());
                await expect(venera.connect(acc1).buy(events[0].args[0], { value: ethers.parseEther("1") }))
                    .to.be.reverted;
            });

            it("Should reject purchase due to insufficient balance for high-value token", async () => {
                await mint1155(acc2, 10, 1);
                await test1155.connect(acc2).setApprovalForAll(venera.target, true);
                await venera.connect(acc2).sellMulti(test1155.target, 1, 1, ethers.parseEther("10000"), 60 * 60 * 12);
                const events = await venera.queryFilter(await venera.filters.SaleCreate())
                await expect(venera.connect(acc1).buy(events[0].args[0]))
                    .to.reverted;
            });
        });
    });
});