import { Button, HStack, Image, Input, Text, useDisclosure, VStack } from '@chakra-ui/react';
import erc20abi from '../abi/erc20.json';
import { ethers } from 'ethers'
import { DepositModal } from './DepositModal';
import { getAddress } from '../hooks';
import { useLoaderData } from 'react-router-dom';

export const Token = ({token, balance} : any) => {

  const account = getAddress()

  return (
    <HStack borderRadius={'lg'} w={'100%'} _hover={{background: '#272e3d', transitionDuration: '300ms' }} p={4}>
      <Image src={token.logoURI} width={'32px'} height={'32px'} />
      <VStack textAlign={'left'} alignItems={'left'} spacing={0}>
        <Text color={'#a0a0a0'} fontSize={'lg'}>{token.name}</Text>
        <Text fontSize={'xs'} color={'#445269'}>{token.symbol}</Text>
      </VStack>
      <HStack flexGrow={1} justifyContent={'flex-end'} spacing={5}>
        <Text color={'#a0a0a0'}>{balance}</Text>
        <DepositModal 
          maxBalance={balance} 
          token={token}
          account={account}
        />
      </HStack>
    </HStack>
  )
}