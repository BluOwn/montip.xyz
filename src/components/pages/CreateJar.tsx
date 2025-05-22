// src/components/pages/CreateJar.tsx - Fixed version

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input, Textarea } from '@/components/common/Input';
import { useJar } from '@/hooks/useJar';
import { useWeb3Context } from '@/hooks/useWeb3';
import { isValidUsername } from '@/utils/validation';
import { MAX_USERNAME_LENGTH, MAX_DESCRIPTION_LENGTH } from '@/constants';
import toast from 'react-hot-toast';

export const CreateJar: React.FC = () => {
  const navigate = useNavigate();
  const { account, isConnected, connect } = useWeb3Context();
  const { createJar, isUsernameAvailable } = useJar();
  
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Check username validity and availability when it changes
  useEffect(() => {
    const checkUsername = async () => {
      if (!username) {
        setUsernameAvailable(null);
        return;
      }

      // First check if the username is valid
      if (!isValidUsername(username)) {
        setError('Username must only contain letters, numbers, underscores, hyphens, and periods');
        setUsernameAvailable(false);
        return;
      } else {
        setError(null);
      }

      // If valid, check availability
      setIsCheckingUsername(true);
      try {
        const available = await isUsernameAvailable(username);
        setUsernameAvailable(available);
        if (!available) {
          setError(`Username @${username} is already taken`);
        }
      } catch (err) {
        console.error('Error checking username:', err);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(() => {
      checkUsername();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, isUsernameAvailable]);

  const handleConnectWallet = async () => {
    await connect();
  };

  const handleCreateJar = async () => {
    if (!account) {
      await connect();
      return;
    }
    
    // Validate inputs
    if (!username) {
      setError('Username is required');
      return;
    }
    
    if (!isValidUsername(username)) {
      setError('Username must only contain letters, numbers, underscores, hyphens, and periods');
      return;
    }
    
    if (username.length > MAX_USERNAME_LENGTH) {
      setError(`Username must be ${MAX_USERNAME_LENGTH} characters or less`);
      return;
    }
    
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
      return;
    }

    if (usernameAvailable === false) {
      setError(`Username @${username} is already taken`);
      return;
    }
    
    setError(null);
    setIsCreating(true);
    
    try {
      const success = await createJar(username, description);
      
      if (success) {
        toast.success('Tip jar created successfully!');
        navigate('/dashboard');
      } else {
        toast.error('Failed to create tip jar');
      }
    } catch (error: any) {
      console.error('Error creating jar:', error);
      setError(error.message || 'Error creating tip jar');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Create Your Tip Jar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-gray-500">
              Create your tip jar to start receiving tips from your audience.
            </p>
            
            {!isConnected ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">
                  Connect your wallet to create a tip jar.
                </p>
                <Button onClick={handleConnectWallet}>
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <>
                <Input
                  label="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                  maxLength={MAX_USERNAME_LENGTH}
                  hint="Only letters, numbers, underscores, hyphens, and periods allowed"
                  required
                />
                
                {isCheckingUsername && (
                  <div className="text-sm text-gray-500">Checking username availability...</div>
                )}
                
                {usernameAvailable === true && username && isValidUsername(username) && (
                  <div className="text-sm text-green-500">Username is available</div>
                )}
                
                <Textarea
                  label="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell people why they should tip you..."
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  rows={4}
                />
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex flex-col sm:flex-row w-full space-y-2 sm:space-y-0 sm:space-x-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateJar} 
              isLoading={isCreating} 
              disabled={!isConnected || !username || isCreating || usernameAvailable === false || !isValidUsername(username)} 
              className="flex-1"
            >
              Create Tip Jar
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};