import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Client Initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const isUrlValid = supabaseUrl && supabaseUrl.startsWith('http');
const supabase = isUrlValid && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Data Layer Service
 * Handles data retrieval from multiple sources (CSV, Supabase)
 */
export const dataService = {
  /**
   * Fetch all sales data
   * Priority: Supabase (if configured) > CSV (fallback)
   */
  async getSalesData() {
    const dataSource = process.env.DATA_SOURCE || 'csv';

    // 1. Try Supabase if explicitly requested
    if (dataSource === 'supabase' && supabase) {
      try {
        const { data, error } = await supabase
          .from('sales_data')
          .select('*')
          .order('date', { ascending: true });

        if (!error && data && data.length > 0) {
          console.log('Serving data from SUPABASE');
          return data;
        }
        console.warn('Supabase fetch returned no data or error, checking fallback...');
      } catch (err) {
        console.warn('Supabase connection failed');
      }
    }

    // 2. Fallback to CSV
    try {
      const csvPath = path.join(__dirname, 'data', 'sales_data.csv');
      const csvData = await fs.readFile(csvPath, 'utf8');
      
      return new Promise((resolve, reject) => {
        Papa.parse(csvData, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            const rows = results.data.filter(row => row.date);
            console.log('Successfully fetched data from CSV');
            resolve(rows);
          },
          error: (error) => reject(error)
        });
      });
    } catch (error) {
      console.error('Data Source Error:', error);
      throw new Error('All data sources failed');
    }
  }
};
