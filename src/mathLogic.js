// src/mathLogic.js

// Utilities
const rn = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (array) => array.sort(() => Math.random() - 0.5);

// Create false answers around the correct one
const generateOptions = (correctAns) => {
    const options = new Set([correctAns]);
    while (options.size < 4) {
        // Generate believable wrong answers
        const offset = rn(1, 3) * (Math.random() > 0.5 ? 1 : -1);
        const shift10 = rn(1, 2) * 10 * (Math.random() > 0.5 ? 1 : -1);
        
        let wrong = correctAns;
        const tactic = Math.random();
        if (tactic < 0.4) wrong += offset;
        else if (tactic < 0.7) wrong += shift10;
        else wrong = correctAns * (Math.random() > 0.5 ? -1 : 1) + offset;
        
        // No floats unless correctAns is float, let's keep it integer mostly
        wrong = Math.round(wrong * 100) / 100;
        
        if (wrong !== correctAns) options.add(wrong);
    }
    
    const optionsArray = Array.from(options);
    shuffle(optionsArray);
    return {
        answers: optionsArray,
        correctIndex: optionsArray.indexOf(correctAns)
    };
};

export const generateMathQuiz = (level) => {
    let q = "";
    let ans = 0;

    switch (level) {
        case 1: { // Grade 1: Add/sub < 20
            const isAdd = Math.random() > 0.5;
            let a = rn(1, 20);
            let b = rn(1, 20);
            if (!isAdd && a < b) [a, b] = [b, a]; // Positive results only
            q = `${a} ${isAdd ? '+' : '-'} ${b} = ?`;
            ans = isAdd ? a + b : a - b;
            break;
        }
        case 2: { // Grade 2: Add/sub < 100
            const isAdd = Math.random() > 0.5;
            let a = rn(10, 99);
            let b = rn(10, 99);
            if (!isAdd && a < b) [a, b] = [b, a];
            q = `${a} ${isAdd ? '+' : '-'} ${b} = ?`;
            ans = isAdd ? a + b : a - b;
            break;
        }
        case 3: { // Grade 3: Mult/Div small
            const isMult = Math.random() > 0.5;
            if (isMult) {
                const a = rn(2, 10);
                const b = rn(2, 10);
                q = `${a} × ${b} = ?`;
                ans = a * b;
            } else {
                const a = rn(2, 10);
                const b = rn(2, 10);
                const prod = a * b;
                q = `${prod} ÷ ${a} = ?`;
                ans = b;
            }
            break;
        }
        case 4: { // Grade 4: Big Mult/Div
            const isMult = Math.random() > 0.5;
            if (isMult) {
                const a = rn(11, 30);
                const b = rn(2, 15);
                q = `${a} × ${b} = ?`;
                ans = a * b;
            } else {
                const a = rn(2, 25);
                const b = rn(11, 40);
                const prod = a * b;
                q = `${prod} ÷ ${a} = ?`;
                ans = b;
            }
            break;
        }
        case 5: { // Grade 5: Order of operations
            const a = rn(2, 20);
            const b = rn(2, 10);
            const c = rn(2, 10);
            const isAddFirst = Math.random() > 0.5;
            if (isAddFirst) {
                q = `${a} + ${b} × ${c} = ?`;
                ans = a + (b * c);
            } else {
                q = `${a} × ${b} - ${c} = ?`;
                ans = (a * b) - c;
            }
            break;
        }
        case 6: { // Grade 6: Algebra / Find X
            const x = rn(-15, 15) || 1; // avoid 0 to be safe
            const a = rn(2, 9) * (Math.random() > 0.5 ? 1 : -1);
            const b = rn(1, 30) * (Math.random() > 0.5 ? 1 : -1);
            const c = a * x + b;
            const op = b < 0 ? '-' : '+';
            q = `Tìm x biết: ${a}x ${op} ${Math.abs(b)} = ${c}`;
            ans = x;
            break;
        }
        default:
            return generateMathQuiz(1);
    }

    const { answers, correctIndex } = generateOptions(ans);
    return { question: q, answers, correctIndex };
};
