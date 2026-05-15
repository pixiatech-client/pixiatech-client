'use client';

import { PersonalizationEditor } from './_components/personalization-editor';
import { motion } from 'framer-motion';

export default function PersonalizationPage() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-7xl mx-auto"
        >
            <PersonalizationEditor />
        </motion.div>
    );
}
