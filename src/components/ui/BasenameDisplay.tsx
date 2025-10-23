"use client";

import { useEffect, useState } from 'react';
import { Address, Avatar, Name, Identity } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';

interface BasenameDisplayProps {
  address: string;
  showAvatar?: boolean;
  className?: string;
}

export function BasenameDisplay({ address, showAvatar = false, className = '' }: BasenameDisplayProps) {
  if (!address || address.length < 10) {
    return <span className={className}>{address}</span>;
  }

  return (
    <Identity
      address={address as `0x${string}`}
      chain={base}
      className={className}
    >
      {showAvatar && <Avatar />}
      <Name>
        <Address />
      </Name>
    </Identity>
  );
}

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
