import React from "react"
import {
  VStack,
  Heading,
  Button,
} from "@chakra-ui/react"
import "@fontsource/volkhov"

export const Landing = () => {
  return ( 
      <VStack h={'90vh'} flexGrow={1} w='full' justifyContent={'center'} alignItems={'center'} spacing={3}>
            <>
              <Heading size={'4xl'}>LEFi</Heading>
              <Heading>Earn yield on unused collateral</Heading>
              <Button colorScheme={'blue'}>Enter App</Button>
            </>
      </VStack>
  )
}
