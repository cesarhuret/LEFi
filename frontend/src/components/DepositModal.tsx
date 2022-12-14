import { Box, Button, Heading, HStack, Image, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, NumberInput, NumberInputField, Slider, SliderFilledTrack, SliderMark, SliderThumb, SliderTrack, Text, useBreakpointValue, useDisclosure, useFocusEffect, VStack } from '@chakra-ui/react';
import erc20abi from '../abi/erc20.json';
import { ethers } from 'ethers'
import { getSwitcherContract, getTokenContract } from '../hooks';
import { useState, useEffect } from 'react';
import switcher from "../abi/Switcher.json";
import { EulerManager } from '../hooks/constants';

export const DepositModal = ({ maxBalance, token, account } : any) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const Overlay = () => (
    <ModalOverlay bg="blackAlpha.700" />
  );

  const modalSize = useBreakpointValue({ base: "xs", sm: "sm", md: "md" });

  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const checkAllowance = async () => {
      const tokenContract = await getTokenContract(token.address);
      const allowance = await (await tokenContract).allowance(account, EulerManager);
      setIsAllowed(parseFloat(ethers.utils.formatUnits(allowance, 6)) > 0);
    }
    checkAllowance();
  }, [])
      
  return (
    <>
      <Button color={'#576d91'} borderColor={'#576d91'} variant='outline' _hover={{bgColor: 'transparent'}} size={'sm'} onClick={onOpen}>
        Deposit
      </Button>
      <Modal
        isCentered
        isOpen={isOpen}
        onClose={onClose}
        closeOnOverlayClick={false}
        size={modalSize}
      >
        <Overlay />
        <ModalContent py="2.5rem" bgColor={'#191d28'}>
          <ModalCloseButton />
          <Box>
            <ModalBody textAlign={"center"} px={16} py={12}>
              <DepositForm max={maxBalance} token={token.address} account={account} isAllowed={isAllowed}/>
            </ModalBody>
          </Box>
      </ModalContent>
      </Modal>
    </>
  )
}

const DepositForm = ({ max, token, account, isAllowed }: any) => {
  const labelStyles = {
    mt: '2',
    ml: '-2.5',
    fontSize: 'sm',
  }
  
  const [amount, setAmount] = useState(10);
  const [loan, setLoan] = useState(5);
  const [healthFactor, setHealthFactor] = useState((10/5)*100);

  useEffect(() => {
    setHealthFactor(Math.trunc((amount/loan)*100))
  }, [amount, loan])

  return (
    <VStack spacing={16}>
      {
        isAllowed ?
        <>
          <Box w={'full'}>
            <Text w={'full'} textAlign={'left'}>Collateral</Text>
            <HStack w='full'>
              <NumberInput value={amount} borderColor={amount > max ? 'red.600' : 'teal.500'}>
                <NumberInputField
                  placeholder={'Max Amount: ' + max}
                  onChange={e => {
                    const result = isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value);
                    setAmount(result);
                  }}
                />
              </NumberInput>
              <Button colorScheme='teal' variant='outline' _hover={{bgColor: 'whiteAlpha.400'}}
                onClick={() => setAmount(parseFloat(max))}
              >
                MAX: {max}
              </Button>
            </HStack>
          </Box>
          <Box w={'full'}>
            <Text w={'full'} textAlign={'left'}>Loan</Text>
            <HStack w='full'>
              <NumberInput value={loan} borderColor={loan > amount ? 'red.600' : 'teal.500'}>
                <NumberInputField
                  placeholder={'Amount to receive'}
                  onChange={e => {
                    const result = isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value);
                    setLoan(result);
                  }}
                />
              </NumberInput>
              <Text textAlign={'center'} flexGrow={1}>WETH</Text>
            </HStack>
          </Box>
          <Box w={'full'}>
            <Text w={'full'} textAlign={'left'}>Health Factor</Text>
            <HStack w='full'>
              <Text textAlign={'center'} flexGrow={1} fontSize={'xs'} >MIN: 125%</Text>
              <NumberInput value={healthFactor} borderColor={loan > amount || healthFactor < 125 || healthFactor > ((amount/loan)*100) ? 'red.600' : 'teal.500'}>
                <NumberInputField
                  placeholder={'Health Factor'}
                  onChange={e => {
                    const result = isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value);
                    setHealthFactor(Math.trunc(result));
                  }}
                />
              </NumberInput>
              <Text textAlign={'center'} flexGrow={1}>%</Text>
              <Text textAlign={'center'} flexGrow={1} fontSize={'xs'} >MAX: {Math.trunc((amount/loan)*100)}%</Text>
            </HStack>
          </Box>
          <Button
            colorScheme='teal'
            variant='outline'
            _hover={{bgColor: 'whiteAlpha.400'}}
            w={'full'}
            onClick={() => {
              getSwitcherContract()
              .then(async (contract :any) => {
                try {
                  // uint256 _totalDeposit,
                  // uint256 _collateral,
                  // address _borrowToken,
                  // uint256 _loanValueInBorrowedToken
                  const data = await contract.getTotalBorrowedAmountInBase('0x7e764ef3ca3a1f2ed4e4ce6ad162021148b09460');
                  console.log(data)

                  const lol = await contract.getAssetPrice('0x2e3A2fb8473316A02b8A297B982498E661E1f6f5');
                  console.log(lol)

                  const tx = await contract.deposit(
                    (100).toString(),
                    (45).toString(),
                    '0x07C725d58437504CA5f814AE406e70E21C5e8e9e',
                    (1).toString(),
                    { gasLimit: 1000000 }
                  );
                  const result = await tx.wait();
                  console.log(result)
                } catch(e) {
                  console.log(e)
                }
              })
            }}
            isDisabled={amount > max || loan > amount || healthFactor < 125 || healthFactor > ((amount/loan)*100) }
          >
            Deposit & Create Loan
          </Button>
          <Button
            colorScheme='red'
            variant='outline'
            _hover={{bgColor: 'whiteAlpha.400'}}
            w={'full'}
            onClick={() => {
              getSwitcherContract()
              .then(async (contract :any) => {
                try {
                  const tx = await (await getTokenContract('0x07C725d58437504CA5f814AE406e70E21C5e8e9e')).approve(
                    EulerManager,
                    ethers.constants.MaxUint256
                  );
                  const result = await tx.wait();

                } catch(e) {
                  console.log(e)
                }
              })
            }}
            isDisabled={amount > max}
          >
            Approve Contract
          </Button>
          <Button
            colorScheme='red'
            variant='outline'
            _hover={{bgColor: 'whiteAlpha.400'}}
            w={'full'}
            onClick={() => {
              getSwitcherContract()
              .then(async (contract :any) => {
                try {
                  const data = await contract.getDebtInBorrowedToken('0x07C725d58437504CA5f814AE406e70E21C5e8e9e');
                  console.log(data)

                  // uint256 _totalWithdrawal,
                  // uint256 _amountToRepayInBorrowed,
                  // uint256 _amountToRepayInBase,
                  // uint256 _amountToWithdrawInBase,
                  // uint256 _amountToUnstake,
                  // address _borrowToken
                  const tx = await contract.withdraw(
                    (100*1000000).toString(),
                    (500000000000000000).toString(),
                    (15*1000000).toString(),
                    (22.5*1000000).toString(),
                    (0).toString(),
                    '0x07C725d58437504CA5f814AE406e70E21C5e8e9e',
                    { gasLimit: 1000000 });
                  const result = await tx.wait();

                } catch(e) {
                  console.log(e)
                }
              })
            }}
            isDisabled={amount > max}
          >
            Widthdraw Tokens
          </Button>
          <Button
            colorScheme='red'
            variant='outline'
            _hover={{bgColor: 'whiteAlpha.400'}}
            w={'full'}
            onClick={() => {
              getSwitcherContract()
              .then(async (contract :any) => {
                try {
                  const data = await contract.getDebtInBorrowedToken('0x07C725d58437504CA5f814AE406e70E21C5e8e9e');
                  console.log(data)

                  // uint256 _totalWithdrawal,
                  // uint256 _amountToRepayInBorrowed,
                  // uint256 _amountToRepayInBase,
                  // uint256 _amountToWithdrawInBase,
                  // uint256 _amountToUnstake,
                  // address _borrowToken
                  const tx = await contract.setNewPositionHealthRatio(
                    (150).toString(),
                    { gasLimit: 1000000 });
                  const result = await tx.wait();

                } catch(e) {
                  console.log(e)
                }
              })
            }}
            isDisabled={amount > max}
          >
            Set New Health Ratio
          </Button>
        </>
        : <Button
            colorScheme='teal'
            variant='outline'
            _hover={{bgColor: 'whiteAlpha.400'}}
            w={'full'}
            onClick={async () => {
                try {
                  
                  // const tx = await (await getTokenContract(token)).approve(
                  //   EulerManager,
                  //   ethers.constants.MaxUint256
                  // );
                  
                  // console.log(tx)
                
                  getSwitcherContract()
                  .then(async (contract :any) => {
                    try {
                      // uint256 _totalDeposit,
                      // uint256 _collateral,
                      // address _borrowToken,
                      // uint256 _loanValueInBorrowedToken
                      const data = await contract.getTotalBorrowedAmountInBase('0x7e764ef3ca3a1f2ed4e4ce6ad162021148b09460');
                      console.log(data)
    
                      const lol = await contract.getAssetPrice('0x2e3A2fb8473316A02b8A297B982498E661E1f6f5');
                      console.log(lol)
    
                      const tx = await contract.deposit(
                        (100*1000000).toString(),
                        (45*1000000).toString(),
                        '0x07C725d58437504CA5f814AE406e70E21C5e8e9e',
                        (1*1000000000000000000).toString(),
                        { gasLimit: 1000000 }
                      );
                      const result = await tx.wait();
                      console.log(result)
                    } catch(e) {
                      console.log(e)
                    }
                  })
                
                } catch(e) {
                  console.log(e)
                }
            }}
          >
            Approve Contract
          </Button>
    }
    </VStack>
  )
}