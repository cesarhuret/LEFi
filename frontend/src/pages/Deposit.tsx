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
      <VStack flexGrow={1} w='full' justifyContent={'flex-start'} alignItems={'center'} spacing={3} my={20}>
        {loader !== null ?
          <>
            <Heading fontSize={'3xl'}  w={'80%'} textAlign={'left'} justifySelf={'flex-start'}>All Assets</Heading>
            {loader.tokens.map((token: any, index: number) => (
              <Token token={token} key={index} balance={loader.balances[index]}/>
            ))}
          </>
          : 
        	<Text>Please Connect Metamask</Text>
        }
      </VStack>
  )
}
