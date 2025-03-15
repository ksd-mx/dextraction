import { useMemo } from 'react';
import { useTokenStore } from '@/store/token-store';

interface UseOptimizedTokensOptions {
  excludeAddress?: string;
}

/**
 * Custom hook for working with tokens with optimized performance
 */
const useOptimizedTokens = ({ excludeAddress }: UseOptimizedTokensOptions = {}) => {
  const { tokens, filteredTokens, isLoadingTokens } = useTokenStore();

  const optimizedTokens = useMemo(() => {
    return filteredTokens.filter(token => 
      !excludeAddress || token.address !== excludeAddress
    );
  }, [filteredTokens, excludeAddress]);

  return {
    tokens: optimizedTokens,
    isLoadingTokens
  };
};

export default useOptimizedTokens;