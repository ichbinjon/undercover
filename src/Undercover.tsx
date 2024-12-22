import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Card, CardHeader, CardContent } from './card';
import { wordPairs } from './wordPairs'; // Import wordPairs

// Add types at the top
interface Player {
  name: string;
  role?: 'civilian' | 'undercover' | 'Mr. White';
  word?: string;
  isAlive?: boolean;
}

type GameState = 'setup' | 'reveal' | 'play' | 'vote' | 'end';
type Winner = 'civilians' | 'undercover' | 'Mr. White' | null;
type WordPair = [string, string];

const getRoleDistribution = (playerCount: number): { civilians: number; undercover: number; mrWhite: number } => {
  let mrWhite = 0;
  let undercover = 1; // Default to 1 undercover
  
  if (playerCount > 4) {
    mrWhite = 1;
  }
  
  if (playerCount >= 7 && playerCount <= 9) {
    undercover = 2;
  } else if (playerCount >= 10) {
    undercover = 3;
  }
  
  const civilians = playerCount - undercover - mrWhite;
  
  return {
    civilians,
    undercover,
    mrWhite
  };
};

const shufflePlayers = (players: Player[]): Player[] => {
  const startIndex = Math.floor(Math.random() * players.length);
  return [...players.slice(startIndex), ...players.slice(0, startIndex)];
};

const UndercoverGame = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [initialPlayers, setInitialPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>('setup');
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [winner, setWinner] = useState<Winner>(null);
  const [words, setWords] = useState({ civilian: '', undercover: '' });
  const [showWord, setShowWord] = useState(false);
  const [round, setRound] = useState(1);
  const [playedWords, setPlayedWords] = useState<WordPair[]>([]);

  useEffect(() => {
    const savedPlayers = localStorage.getItem('players');
    const savedPlayedWords = localStorage.getItem('playedWords');
    if (savedPlayers) {
      const parsedPlayers = JSON.parse(savedPlayers) as Player[];
      setPlayers(parsedPlayers);
      setInitialPlayers(parsedPlayers);
    }
    if (savedPlayedWords) {
      setPlayedWords(JSON.parse(savedPlayedWords) as WordPair[]);
    }
  }, []);

  const startGame = () => {
    if (players.length < 3) {
      alert('You need at least 3 players to start the game.');
      return;
    }

    setInitialPlayers(players);

    // Filter out already played word pairs
    const availableWordPairs = (wordPairs as WordPair[]).filter((pair) => 
      !playedWords.some((playedPair) => 
        playedPair[0] === pair[0] && playedPair[1] === pair[1]
      )
    );

    if (availableWordPairs.length === 0) {
      alert('All word pairs have been used! Resetting played words.');
      setPlayedWords([]);
      localStorage.removeItem('playedWords');
      return;
    }

    const randomPair = availableWordPairs[Math.floor(Math.random() * availableWordPairs.length)];
    setWords({ civilian: randomPair[0], undercover: randomPair[1] });

    // Add the word pair to played words
    const newPlayedWords = [...playedWords, randomPair];
    setPlayedWords(newPlayedWords);
    localStorage.setItem('playedWords', JSON.stringify(newPlayedWords));

    // Get role distribution
    const distribution = getRoleDistribution(players.length);
    
    // Create array of indices and shuffle it
    const indices = Array.from({ length: players.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // Assign roles based on shuffled indices
    const undercoverIndices = indices.slice(0, distribution.undercover);
    const mrWhiteIndex = distribution.mrWhite ? indices[distribution.undercover] : -1;

    const newPlayers: Player[] = players.map((player, index) => {
      let role: Player['role'] = 'civilian';
      let word = randomPair[0];

      if (undercoverIndices.includes(index)) {
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

    const shuffledPlayers = shufflePlayers(newPlayers);

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

  const handleEliminate = (selectedPlayer: Player) => {
    const newPlayers = players.map((player) => ({
      ...player,
      isAlive: player.isAlive && selectedPlayer.name !== player.name
    }));

    setPlayers(newPlayers);
    alert(`${selectedPlayer.name}'s role was: ${selectedPlayer.role}.`);

    const alivePlayers = newPlayers.filter(p => p.isAlive);
    const aliveUndercover = alivePlayers.find(p => p.role === 'undercover');
    const aliveMrWhite = alivePlayers.find(p => p.role === 'Mr. White');
    const aliveCivilians = alivePlayers.filter(p => p.role === 'civilian');

    // Win condition checks
    if (alivePlayers.length <= 2) {
      // Mr. White wins if they're alive with only one other player
      if (aliveMrWhite && alivePlayers.length === 2) {
        setWinner('Mr. White');
        setGameState('end');
      }
      // Undercover wins if they're alive with only one other player
      else if (aliveUndercover && alivePlayers.length === 2) {
        setWinner('undercover');
        setGameState('end');
      }
      // Civilians win if no special roles are alive
      else if (!aliveUndercover && !aliveMrWhite) {
        setWinner('civilians');
        setGameState('end');
      }
      // Game continues if more than one civilian is alive
      else if (aliveCivilians.length > 1) {
        setGameState('play');
        setCurrentPlayer(0);
        setRound(prev => prev + 1);
      }
    }
    // Civilians win if all special roles are eliminated
    else if (!aliveUndercover && !aliveMrWhite) {
      setWinner('civilians');
      setGameState('end');
    }
    // Game continues
    else {
      setGameState('play');
      setCurrentPlayer(0);
      setRound(prev => prev + 1);
    }
  };

  const addPlayer = (name: string) => {
    if (name && !players.find(p => p.name === name)) {
      const newPlayers = [...players, { name }];
      setPlayers(newPlayers);
      localStorage.setItem('players', JSON.stringify(newPlayers));
      setInitialPlayers(newPlayers);
    }
  };

  const resetGame = () => {
    // Reset to initial players but clear their game state
    const resetPlayers = initialPlayers.map(player => ({
      name: player.name,
      // Remove role, word, and isAlive status
      role: undefined,
      word: undefined,
      isAlive: undefined
    }));
    
    setPlayers(resetPlayers);
    setGameState('setup');
    setCurrentPlayer(0);
    setWinner(null);
    setWords({ civilian: '', undercover: '' });
    setShowWord(false);
    setRound(1);
  };

  const resetSession = () => {
    setPlayedWords([]);
    localStorage.removeItem('playedWords');
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl text-gray-700">Add Players</h2>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-2">Words played this session: {playedWords.length}</p>
                  <Button 
                    onClick={resetSession} 
                    className="bg-orange-500 hover:bg-orange-600 text-white text-sm"
                  >
                    Reset Session
                  </Button>
                </div>
              </div>
              <div className="flex mb-2">
                <Input
                  type="text"
                  placeholder="Player name"
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      addPlayer(target.value);
                      target.value = '';
                    }
                  }}
                  className="mr-2 text-black"
                />
                <Button onClick={() => {
                  const input = document.querySelector('input') as HTMLInputElement;
                  if (input) {
                    addPlayer(input.value);
                    input.value = '';
                  }
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
                      
                      // Reset session if all players are removed
                      if (newPlayers.length === 0) {
                        resetSession();
                      }
                    }} className="bg-red-500 hover:bg-red-600 text-white ml-2 p-1 text-xs">X</Button>
                  </li>
                ))}
              </ul>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Role Distribution</h3>
                {players.length >= 3 ? (
                  <div className="space-y-1">
                    {(() => {
                      const distribution = getRoleDistribution(players.length);
                      return (
                        <>
                          <p className="text-gray-600">
                            <span className="font-medium">Civilians:</span> {distribution.civilians}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Undercover:</span> {distribution.undercover}
                          </p>
                          {players.length >= 5 && (
                            <p className="text-gray-600">
                              <span className="font-medium">Mr. White:</span> {distribution.mrWhite}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Add at least 3 players to see role distribution</p>
                )}
              </div>
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
                  <p className="text-xl font-bold mb-4 text-gray-800">
                    {players[currentPlayer].role === 'Mr. White' 
                      ? "You are Mr. White. You do not have a word."
                      : `Your word is: ${players[currentPlayer].word}`}
                  </p>
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
              <p className="text-gray-600">The undercover players were:</p>
              {players.filter(player => player.role === 'undercover').map((player, index) => (
                <p key={index} className="text-gray-800 font-bold">{player.name}</p>
              ))}
              {players.some(player => player.role === 'Mr. White') && (
                <>
                  <p className="text-gray-600">The Mr White player was:</p>
                  <p className="text-gray-800 font-bold">{players.find(player => player.role === 'Mr. White')?.name}</p>
                </>
              )}
              <Button onClick={resetGame} className="mt-4 bg-purple-500 hover:bg-purple-600 text-white">Play Again</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UndercoverGame;