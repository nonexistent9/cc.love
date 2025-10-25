'use client';

import Image from 'next/image';

export default function Home() {
  return (
    <div style={{
      fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'cursive'",
      backgroundColor: '#fcfcfc',
      color: '#333',
      maxWidth: '700px',
      margin: '0 auto',
      padding: '20px',
      lineHeight: '1.6'
    }}>
      <main style={{
        border: '3px solid #000',
        backgroundColor: '#fff',
        padding: '20px 30px',
        borderRadius: '10px'
      }}>
        {/* Simple hand-drawn-style heart SVG */}
        <svg 
          width="40" 
          height="40" 
          viewBox="0 0 24 24" 
          style={{ 
            display: 'block', 
            margin: '0 auto 10px',
            strokeWidth: '3',
            stroke: '#d90429',
            fill: 'none'
          }}
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>

        <h1 style={{
          textAlign: 'center',
          color: '#d90429',
          fontSize: '2.5em',
          marginBottom: '0'
        }}>
          Cupid Copilot
        </h1>
        <p style={{
          textAlign: 'center',
          fontSize: '1.2em',
          marginTop: '5px',
          fontWeight: 'bold'
        }}>
          (cc.love)
        </p>
        
        <h2 style={{
          textAlign: 'center',
          color: '#d90429'
        }}>

          <br />
          Got funded? It&apos;s time to get laid lil bro
        </h2>

        <br />

        

        <p style={{ fontSize: '1.1em' }}>
          As a man, the odds are stacked against you on dating apps. 
          </p>


        <p style={{ fontSize: '1.1em' }}>
         Roughly 20% of men get 80% of the matches. 

          </p>

          <br />

          <p style={{ fontSize: '1.1em' }}>
          
          The game is rigged. If you wanna compete against the giga chads, you need an edge. 
         
        </p>

        <br />

        <p style={{ fontSize: '1.1em' }}>
        You need <strong>cc.love</strong>
        </p>

        <br />

        <p style={{ fontSize: '1.1em' }}>
          We&apos;re the AI wingman that lives on your phone, analyzes profiles, and gives you rizz that actually works. No more &quot;hey&quot;.
        </p>
        <br />

        {/* The "This Guys Fucks" Meme Box */}
        <div style={{
          border: '3px dashed #000',
          padding: '10px 20px',
          textAlign: 'center',
          margin: '25px auto',
          backgroundColor: '#f0f0f0',
          borderRadius: '5px'
        }}>
          <img 
            src="/image.png" 
            alt="This guy fucks meme from Silicon Valley"
            style={{
              width: '100%',
              maxWidth: '500px',
              height: 'auto',
              borderRadius: '5px',
              margin: '10px 0'
            }}
          />

          <h2 style={{
            fontSize: '2em',
            fontWeight: 'bold',
            color: '#d90429',
            margin: '20px 0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            lineHeight: '1.3'
          }}>
            This could be you if you use cc.love
          </h2>
        
        </div>

        <hr style={{
          border: 'none',
          borderTop: '3px dashed #888',
          margin: '30px 0'
        }} />

        {/* About Section */}
        <div style={{
          backgroundColor: '#fff8e1',
          padding: '20px',
          border: '2px solid #000',
          borderRadius: '8px'
        }}>
          <h2 style={{
            marginTop: '0',
            color: '#004d40',
            textAlign: 'center'
          }}>
            {/* Simple hand-drawn-style arrow SVG */}
            <svg 
              width="30" 
              height="30" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#004d40" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                margin: '0 8px'
              }}
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
            Why we started this
          </h2>

          <br />

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '10px auto 20px'
          }}>
            <Image 
              src="/IMG_8803.jpeg" 
              alt="Varun"
              width={300}
              height={300}
              style={{
                borderRadius: '10px',
                border: '3px solid #000',
                objectFit: 'cover'
              }}
              priority
            />
          </div>

          <p style={{ fontSize: '1.1em' }}>
            i&apos;m varun, your usual bay area techbro founder.
          </p>

          <br />

          <p style={{ fontSize: '1.1em' }}>
            i was locked in and grinding for the last two years. building, shipping, raising. but my life was empty.
          </p>
          <br />

          <p style={{ fontSize: '1.1em' }}>
            and i was bugging my co-founder and cto too much. (he has a gf btw).
          </p>

          <br />

          <p style={{ fontSize: '1.1em' }}>
            now i&apos;m back on dating apps.
          </p>
          <br />

          <p style={{ fontSize: '1.1em' }}>
            the problem? <strong>i have no rizz.</strong>
          </p>
          <br />
          
          <p style={{ fontSize: '1.1em' }}>
            so we&apos;re building the solution. for me. for you. for all of us.
          </p>
          <br />
        </div>

        {/* Launch Announcement */}
        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          padding: '30px 20px',
          backgroundColor: '#fff8e1',
          border: '3px solid #000',
          borderRadius: '10px',
          boxShadow: '4px 4px 0 #000'
        }}>
          <h2 style={{
            color: '#d90429',
            fontSize: '2.5em',
            fontWeight: 'bold',
            margin: '0',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            Launching at 5PM Oct 26th
          </h2>
        </div>
      </main>

      <footer style={{
        textAlign: 'center',
        marginTop: '20px',
        fontSize: '0.9em',
        color: '#777'
      }}>
        <p>&copy; 2025 Cupid Copilot. We are probably not liable if you say something weird.</p>
      </footer>
    </div>
  );
}
