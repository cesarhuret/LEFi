import React, { useEffect } from "react"
import {
  ChakraProvider,
  Box,
  Text,
  Link,
  VStack,
  Code,
  Grid,
  theme,
  Flex,
  Heading,
  Button,
  HStack,
  Image,
} from "@chakra-ui/react"
import { Token } from "../components/Token";
import { useLoaderData } from "react-router-dom";

export const Deposit = () => {

  const loader: any = useLoaderData()

  return (
    <Flex w={'full'} justifyContent={'center'} alignItems={'center'}>
      <VStack gap={0} spacing={0} flexGrow={1} maxW={{base: '100%', md: '80%'}} bgColor={'#1b1f29'} justifyContent={'flex-start'} borderRadius={'lg'} p={{base: 0, md: 10}} alignItems={'center'} my={20}>
        {loader !== null ?
          <>
            <Heading fontSize={'3xl'} mb={5} w={'100%'} textAlign={'left'} justifySelf={'flex-start'}>All Assets</Heading>
            {loader.tokens.map((token: any, index: number) => (
              <Token token={token} key={index} balance={loader.balances[index]}/>
            ))}
          </>
          :
          <>
            <Image ml={'2'} w={'76px'} src={'/metamask-fox.svg'} />
            <Text>Please Connect Metamask</Text>
          </>

        }
      </VStack>
    </Flex>

  )
}
