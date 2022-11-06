import { createBrowserRouter, json, redirect } from "react-router-dom";
import { App } from "./App";

import { getToken, Spinner } from "@chakra-ui/react";
import ErrorElement from "./components/ErrorElement";
import { Deposit } from "./pages/Deposit";
import { Manage } from "./pages/Manage";
import { Landing } from "./pages/Landing";
import { getAddress, getENSName, getSwitcherContract, getTokenBalance, getTokenData, isMetaMaskConnected } from "./hooks";
import tokenList from './goerli-tokenlist.json'
import { ethers } from "ethers";

const router = createBrowserRouter([
    {
		path: "/",
		element: <App />,
		errorElement: <ErrorElement/>,
		children: [
			{
				path: "/",
				element: <Landing />,
			},
			{
				path: "/all",
				element: <Deposit />,
				loader: async () => {
					const metamask = await isMetaMaskConnected();
					if(!metamask) {
						return null;
					} else if(metamask == true) {
						const address = await getAddress();
						const list = await tokenList.tokens.map(async token => await getTokenBalance(token.address, address));
						const promisedList = await Promise.all(list).then((values) => values)
						return { tokens: tokenList.tokens, balances: promisedList };
					}
				}
			},
			{
				path: "/manage",
				element: <Manage />,
				loader: async () => {
					const address = await getAddress();
					console.log(address)
					const list = await tokenList.tokens.map(async token => 
						await getSwitcherContract().then((contract) => contract.balances(address)));
					const promisedList = await Promise.all(list).then((values) => values)
					const res = promisedList.filter((balance: string) => parseFloat(balance) > 0).map((balance) => ({...tokenList.tokens[promisedList.indexOf(balance)], balance:  ethers.utils.formatUnits(balance, 6)}));
					console.log(res);
					return [res[0]];
				}
			},
		]
    },
]);

export default router