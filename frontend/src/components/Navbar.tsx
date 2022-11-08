import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  Icon,
  useColorModeValue,
  useBreakpointValue,
  useDisclosure,
  Image,
} from '@chakra-ui/react';

import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
} from '@chakra-ui/icons';

import { Link, NavLink, redirect, useLoaderData, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAddress, isMetaMaskConnected } from '../hooks';

export default function Navbar() {

	const [account, setAccount] = useState<any>(null);

	const { isOpen, onToggle } = useDisclosure();

	const [connected, setConnected] = useState<any>(null);

	const connectWallet = async () => setAccount(await getAddress());

	useEffect(() => {

		(async () => {

			const metamask = await isMetaMaskConnected();
			await setConnected(metamask)

		})();

	}, []);
	
	useEffect(() => {
		(async () => {

			if(connected !== null) {
				connected ? setAccount(await getAddress()) : setAccount(null);
			}

		})();

	}, [connected])
	
	return (
		<Box>
			<Flex
				bg={'transparent'}
				color={useColorModeValue('white', 'white')}
				borderBottomWidth={'0.05em'}
				borderBottomColor={'#1e232e'}
				minH={'9.1vh'}
				py={{ base: 2 }}
				px={{ base: 4, md: '10%' }}
				align={'center'}
			>
				<Flex
					flex={{ base: 1, md: 'auto' }}
					ml={{ base: -2 }}
					display={{ base: 'flex', md: 'none' }}
				>
					<IconButton
						onClick={onToggle}
						icon={
							isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
						}
						variant={'ghost'}
						aria-label={'Toggle Navigation'}
					/>
				</Flex>
				<Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }} alignItems={'center'}>
					<Link to={'/'}>
						<Image src={'/logo.png'} width={'64px'} height={'33.5px'}/>
					</Link>
					
					<Flex display={{ base: 'none', md: 'flex' }} ml={10}>
						<DesktopNav />
					</Flex>
				</Flex>
				<Stack
					flex={{ base: 1 }}
					justify={'flex-end'}
					direction={'row'}
					spacing={6}
					alignItems={"center"}
				>
					{connected !== null ?
						<>
							{
								typeof account === 'string' ? (
									<Box bgColor={'blue.400'} px={4} py={2} fontSize={'sm'} fontWeight={'light'} borderRadius={'3xl'}>
										{account.substring(0, 5) + '...' + account.substring(account.length -3, account.length)}
									</Box>
								): 	<Button colorScheme={'blue'} fontSize={'sm'} borderRadius={'3xl'} onClick={connectWallet}>
										Connect <Image ml={'2'} w={'16px'} src={'/metamask-fox.svg'} />
									</Button>
							}
						</>
						: null
					}
				</Stack>
			</Flex>
			<Collapse in={isOpen} animateOpacity>
				<MobileNav />
			</Collapse>
		</Box>
		);
	}

	const activeStyle = {
		fontWeight: "semibold",
		fontSize: '0.8em',
		color: '#ffffff'
	}
	
	const inactiveStyle = {
		fontSize: '0.8em',
		fontWeight: "semibold",
		color: '#576d91',
		_hover: {
			bgColor: 'red.300',
		}
	}
	
	const DesktopNav = () => {
		return (
		<Stack direction={'row'} spacing={4}>
			{NAV_ITEMS.map((navItem) => (
			<Box key={navItem.label} alignSelf={'center'} _hover={{background: '#272e3d', transitionDuration: '300ms' }} borderRadius={'md'} px={4} py={2}>
				<NavLink
					to={navItem.href ?? '#'}
					style={({ isActive }: any) =>
						isActive ? activeStyle : inactiveStyle
					}
				>
					{navItem.label.toUpperCase()}
				</NavLink>
			</Box>
			))}
		</Stack>
		);
	};
	
	const MobileNav = () => {
		return (
			<Stack
				bg={useColorModeValue('none', 'none')}
				p={4}
				display={{ md: 'none' }}
			>
				{NAV_ITEMS.map((navItem) => (
					<MobileNavItem key={navItem.label} {...navItem} />
				))}
			</Stack>
		);
	};
	
	const MobileNavItem = ({ label, children, href }: NavItem) => {
		const { isOpen, onToggle } = useDisclosure();
	
		return (
		<Stack spacing={4} onClick={children && onToggle}>
			<Flex
				py={2}
				as={NavLink}
				to={href ?? '#'}
				justify={'space-between'}
				align={'center'}
				_hover={{
					textDecoration: 'none',
				}}
			>
				<Text
					fontWeight={600}
					color={useColorModeValue('gray.600', 'gray.200')}>
					{label}
				</Text>
				{children && (
					<Icon
						as={ChevronDownIcon}
						transition={'all .25s ease-in-out'}
						transform={isOpen ? 'rotate(180deg)' : ''}
						w={6}
						h={6}
					/>
				)}
			</Flex>
	
			<Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
			<Stack
				mt={2}
				pl={4}
				borderLeft={1}
				borderStyle={'solid'}
				borderColor={useColorModeValue('gray.200', 'gray.700')}
				align={'start'}
			>
				{children && children.map((child) => <>{child.label}</>)}
			</Stack>
			</Collapse>
		</Stack>
		);
  };
  
  interface NavItem {
    label: string;
    subLabel?: string;
    children?: Array<NavItem>;
    href?: string;
  }
  
  const NAV_ITEMS: Array<NavItem> = [
    {
      label: 'Assets',
      href: 'all',
    },
	{
		label: 'Dashboard',
		href: 'manage',
	},
  ];