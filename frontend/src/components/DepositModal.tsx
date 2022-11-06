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
      <Button colorScheme='teal' variant='outline' _hover={{bgColor: 'whiteAlpha.400'}} size={'sm'} onClick={onOpen}>
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
        <ModalContent py="2.5rem" bgColor={'#082129'}>
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
                  const tx = await contract.deposit((amount*1000000).toString(), ethers.utils.parseUnits((healthFactor/10).toString(), 1), (loan*1000000).toString(), { gasLimit: 5000000 });
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
        </>
        : <Button
            colorScheme='teal'
            variant='outline'
            _hover={{bgColor: 'whiteAlpha.400'}}
            w={'full'}
            onClick={async () => {
                try {
                  const tx = await (await getTokenContract(token)).approve(
                    EulerManager,
                    ethers.constants.MaxUint256
                  );
                  console.log(tx)
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