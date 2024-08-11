import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Card, CardHeader, CardContent } from './card';
import { wordPairs } from './wordPairs'; // Import wordPairs

const shufflePlayers = (players) => {
  const startIndex = Math.floor(Math.random() * players.length);
  return [...players.slice(startIndex), ...players.slice(0, startIndex)];
};

const UndercoverGame = () => {
  const [players, setPlayers] = useState([]);
  const [initialPlayers, setInitialPlayers] = useState([]); // New state for initial players
  const [gameState, setGameState] = useState('setup'); // setup, reveal, play, vote, end
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [winner, setWinner] = useState(null);
  const [words, setWords] = useState({ civilian: '', undercover: '' });
  const [showWord, setShowWord] = useState(false);
  const [round, setRound] = useState(1);

  useEffect(() => {
    const savedPlayers = JSON.parse(localStorage.getItem('players'));
    if (savedPlayers) {
      setPlayers(savedPlayers);
      setInitialPlayers(savedPlayers); // Load initial players
    }
  }, []);

  const startGame = () => {
    if (players.length < 3) {
      alert('You need at least 3 players to start the game.');
      return;
    }

    setInitialPlayers(players); // Save the initial list of players

    const randomPair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
    setWords({ civilian: randomPair[0], undercover: randomPair[1] });

    const undercoverIndex = Math.floor(Math.random() * players.length);
    let mrWhiteIndex = -1;

    if (players.length > 3) {
      do {
        mrWhiteIndex = Math.floor(Math.random() * players.length);
      } while (mrWhiteIndex === undercoverIndex);
    }

    const newPlayers = players.map((player, index) => {
      let role = 'civilian';
      let word = randomPair[0];

      if (index === undercoverIndex) {
        role = 'undercover';
        word = randomPair[1];
      } else if (index === mrWhiteIndex) {
        role = 'Mr. White';
        word = 'Mr. White';
      }

      return {
        ...player,
        role,
        word,
        isAlive: true,
      };
    });

    const shuffledPlayers = shufflePlayers(newPlayers); // Shuffle players

    setPlayers(shuffledPlayers);
    setGameState('reveal');
    setCurrentPlayer(0);
    setRound(1);
  };

  const handleRevealWord = () => {
    setShowWord(true);
  };

  const handleHideWord = () => {
    setShowWord(false);
    if (currentPlayer === players.length - 1) {
      setGameState('play');
      setCurrentPlayer(0);
    } else {
      setCurrentPlayer(prev => prev + 1);
    }
  };

  const handleEliminate = (selectedPlayer) => {
    const newPlayers = players.map((player) => ({
      ...player,
      isAlive: player.isAlive && selectedPlayer.name !== player.name
    }));

    setPlayers(newPlayers);

    // Show the eliminated player's role
    alert(`${selectedPlayer.name}'s role was: ${selectedPlayer.role}.`);

    // Check win condition
    const alivePlayers = newPlayers.filter(p => p.isAlive);
    const aliveUndercover = alivePlayers.find(p => p.role === 'undercover');
    const aliveMrWhite = alivePlayers.find(p => p.role === 'Mr. White');

    if (!aliveUndercover && !aliveMrWhite) {
      setWinner('civilians');
      setGameState('end');
      setPlayers(players);
    } else if (alivePlayers.length <= 2) {
      if (aliveMrWhite) {
        setWinner('Mr. White');
      } else {
        setWinner('undercover');
      }
      setGameState('end');
      setPlayers(players);
    } else {
      setGameState('play');
      setCurrentPlayer(0);
      setRound(prev => prev + 1);
    }
  };

  const addPlayer = (name) => {
    if (name && !players.find(p => p.name === name)) {
      const newPlayers = [...players, { name }];
      setPlayers(newPlayers);
      localStorage.setItem('players', JSON.stringify(newPlayers));
      setInitialPlayers(newPlayers);
    }
  };

  const resetGame = () => {
    setPlayers(initialPlayers); // Reset to initial players
    setGameState('setup');
    setCurrentPlayer(0);
    setWinner(null);
    setWords({ civilian: '', undercover: '' });
    setShowWord(false);
    setRound(1);
  };

  return (
    <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 min-h-screen">
      <Card className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
          <h1 className="text-3xl font-bold">Undercover Game</h1>
        </CardHeader>
        <CardContent className="p-4">
          {gameState === 'setup' && (
            <div>
              <h2 className="text-xl mb-2 text-gray-700">Add Players</h2>
              <div className="flex mb-2">
                <Input
                  type="text"
                  placeholder="Player name"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addPlayer(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="mr-2 text-black"
                />
                <Button onClick={() => {
                  const input = document.querySelector('input');
                  addPlayer(input.value);
                  input.value = '';
                }} className="bg-green-500 hover:bg-green-600 text-white">Add</Button>
              </div>
              <ul className="mb-4 text-gray-600">
                {players.map((player, index) => (
                  <li key={index} className="flex justify-between items-center">
                    {player.name}
                    <Button onClick={() => {
                      const newPlayers = players.filter((_, i) => i !== index);
                      setPlayers(newPlayers);
                      setInitialPlayers(newPlayers);
                      localStorage.setItem('players', JSON.stringify(newPlayers));
                    }} className="bg-red-500 hover:bg-red-600 text-white ml-2 p-1 text-xs">X</Button>
                  </li>
                ))}
              </ul>
              <Button onClick={startGame} className="bg-blue-500 hover:bg-blue-600 text-white">Start Game</Button>
            </div>
          )}

          {gameState === 'reveal' && (
            <div className="text-center">
              <h2 className="text-2xl mb-4 text-gray-700">{players[currentPlayer].name}'s Turn</h2>
              {!showWord ? (
                <Button onClick={handleRevealWord} className="bg-yellow-500 hover:bg-yellow-600 text-white">Reveal Word</Button>
              ) : (
                <div>
                  <p className="text-xl font-bold mb-4 text-gray-800">Your word is: {players[currentPlayer].word}</p>
                  <Button onClick={handleHideWord} className="bg-red-500 hover:bg-red-600 text-white">Hide Word</Button>
                </div>
              )}
            </div>
          )}

          {gameState === 'play' && (
            <div>
              <h2 className="text-2xl mb-2 text-gray-700">Round {round}</h2>
              <p className="mb-4 text-gray-600">Players should describe their word in the following order:</p>
              <ol className="list-decimal list-inside mb-4 text-gray-600">
                {players.filter(player => player.isAlive).map((player, index) => (
                  <li key={index}>
                    {player.name}
                  </li>
                ))}
              </ol>
              <p className="mb-4 text-gray-600">Are you ready to vote?</p>
              <Button onClick={() => setGameState('vote')} className="bg-green-500 hover:bg-green-600 text-white">Start Voting</Button>
            </div>
          )}

          {gameState === 'vote' && (
            <div>
              <h2 className="text-2xl mb-2 text-gray-700">Voting Time</h2>
              <p className="mb-4 text-gray-600">As a group, decide who to eliminate:</p>
              {players.map((player, index) => (
                player.isAlive && (
                  <Button key={index} onClick={() => handleEliminate(player)} className="mr-2 mb-2 bg-red-500 hover:bg-red-600 text-white">
                    {player.name}
                  </Button>
                )
              ))}
            </div>
          )}

          {gameState === 'end' && (
            <div className="text-center">
              <h2 className="text-2xl mb-2 text-gray-700">Game Over</h2>
              <p className="mb-4 text-xl font-bold text-blue-600">
                {winner === 'civilians' ? 'Civilians win!' : winner === 'undercover' ? 'Undercover wins!' : 'Mr White wins!'}
              </p>
              <p className="text-gray-600">The words were:</p>
              <p className="text-gray-800">Civilian: {words.civilian}</p>
              <p className="text-gray-800">Undercover: {words.undercover}</p>
              <p className="text-gray-600">The undercover player was:</p>
              <p className="text-gray-800 font-bold">{players.find(player => player.role === 'undercover').name}</p>
              <p className="text-gray-600">The Mr White player was:</p>
              <p className="text-gray-800 font-bold">{players.find(player => player.role === 'Mr. White').name}</p>
              <Button onClick={resetGame} className="mt-4 bg-purple-500 hover:bg-purple-600 text-white">Play Again</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UndercoverGame;