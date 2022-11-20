import { Box, Button, Heading, HStack, Image, Input, Modal, ModalBody, 
  ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, NumberInput, 
  NumberInputField, Slider, SliderFilledTrack, SliderMark, SliderThumb, SliderTrack, 
  Text, useBreakpointValue, useDisclosure, useFocusEffect, VStack 
} from '@chakra-ui/react';
import erc20abi from '../abi/erc20.json';
import { ethers } from 'ethers'
import { getSwitcherContract, getTokenContract } from '../hooks';
import { useState, useEffect } from 'react';
import switcher from "../abi/Switcher.json";
import { EulerManager } from '../hooks/constants';

export const WithdrawModal = ({ maxBalance, tokenAddress, account } : any) => {

  const { isOpen, onOpen, onClose } = useDisclosure();

  const Overlay = () => (
    <ModalOverlay bg="blackAlpha.700" />
  );

  const modalSize = useBreakpointValue({ base: "xs", sm: "sm", md: "md" });

  return (
    <>
      <Button colorScheme='red' variant='outline' _hover={{bgColor: 'whiteAlpha.200'}} size={'sm'} onClick={onOpen}>
        Withdraw
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
              <WithdrawForm max={maxBalance}/>
            </ModalBody>
          </Box>
      </ModalContent>
      </Modal>
    </>
  )
}

const WithdrawForm = ({max}: any) => {
  
  const [amount, setAmount] = useState(0);
  
  return (
    <VStack spacing={12}>
      <Box w={'full'}>
        <Text w={'full'} textAlign={'left'} py={1}>Amount to Withdraw</Text>
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

              const tx = await contract.withdraw(
                (100*1000000).toString(),
                (1*1000000000000000000).toString(),
                (30*1000000).toString(),
                (45*1000000).toString(),
                (0).toString(),
                '0x07C725d58437504CA5f814AE406e70E21C5e8e9e',
                { gasLimit: 400000 });
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
    </VStack>
  )
}