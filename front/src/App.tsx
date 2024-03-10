import './App.css';
import { Button, Center, Container, Heading } from '@chakra-ui/react';

function App() {
  return (
    <Container mt={100}>
      <Heading size="xl" mb={4}>
        タイトル
      </Heading>
      <Center>
        <Button colorScheme="teal">ボタン</Button>
      </Center>
    </Container>
  );
}

export default App;
