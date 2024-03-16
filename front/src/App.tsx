import { useState } from 'react';
import './App.css';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  Container,
  Heading,
  SimpleGrid,
  Skeleton,
  Stack,
  StackDivider,
  Text,
  VStack,
} from '@chakra-ui/react';

type ApiResponse = {
  users: User[];
};

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
};

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleClick = () => {
    setLoading(true);
    setUsers([]);

    fetch(`${import.meta.env.VITE_API_ENDPOINT}/users`, { referrerPolicy: 'no-referrer' })
      .then((response) => response.json())
      .then((data: ApiResponse) => {
        setUsers(data.users);
        setLoading(false);
      });
  };

  return (
    <Container mt={100}>
      <Heading size="xl" mb={4}>
        ユーザー情報の取得サンプル
      </Heading>
      <Center>
        <Button colorScheme="teal" onClick={handleClick}>
          取得
        </Button>
      </Center>

      <Card mt="20px">
        <CardHeader>
          <Heading size="md" textAlign={'center'}>
            ユーザー一覧
          </Heading>
        </CardHeader>
        <CardBody>
          {users.length === 0 && !loading ? (
            <Center>
              <Text>取得ボタンをクリックしてください</Text>
            </Center>
          ) : loading ? (
            <Stack divider={<StackDivider />}>
              {[...Array(10)].map((_, index) => (
                <Skeleton key={index} height="120px" />
              ))}
            </Stack>
          ) : (
            <VStack align="start" divider={<StackDivider />}>
              {users.map((user) => (
                <Stack key={user.id}>
                  <SimpleGrid columns={2} spacing={2} width="400px">
                    <Text>ID</Text>
                    <Text>{user.id}</Text>
                    <Text>Name</Text>
                    <Text>{user.name}</Text>
                    <Text>UserName</Text>
                    <Text>{user.username}</Text>
                    <Text>EMail</Text>
                    <Text>{user.email}</Text>
                  </SimpleGrid>
                </Stack>
              ))}
            </VStack>
          )}
        </CardBody>
      </Card>
    </Container>
  );
}

export default App;
