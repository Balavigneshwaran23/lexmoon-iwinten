import streamlit as st
from PIL import Image
import base64
import fitz  # PyMuPDF
import openai
from dotenv import load_dotenv
from google.cloud import translate_v2 as translate
import os



# Load environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("APP-CRED")

# Set page config with custom icon
im = Image.open("D:/githubreptasks/lexmoon_summarizer/iwimg/20240917_222343.png")
st.set_page_config(
    page_title="Lexmoon",
    page_icon=im,
    layout="wide",
)

# Load the custom CSS file
def load_css(file_path):
    with open(file_path) as f:
        st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)

# Load external resources like Bootstrap, BoxIcons, etc.
bootstrap_cdn = '''
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
<link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
<script src="https://kit.fontawesome.com/113671771b.js" crossorigin="anonymous"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
<script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>
<script nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>
'''
st.markdown(bootstrap_cdn, unsafe_allow_html=True)

# Load custom CSS for the project
load_css("D:/githubreptasks/lexmoon-iwinten/public/mainpage2.css")

# image_path="D:\githubreptasks\lexmoon-iwinten\public\20240917_222343 (1).png"
# def get_image_base64(image_path):
#     with open(image_path, "rb") as image_file:
#         return base64.b64encode(image_file.read()).decode('utf-8')
    
# st.image("D:/githubreptasks/lexmoon_summarizer/iwimg/IMG-20240907-WA0001-1.png", width=100)



# logo_image_b64 = get_image_base64(logo_image_path)
# Navbar and header section
st.markdown('''
<header>
    <nav id="home" class="navbar navbar-dark navbar-expand-lg">
        <div class="container d-flex align-items-center">
            <div class="d-flex align-items-center">
              <h1 class="text-white ms-2">Lexmoon</h1>
            </div>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarnav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarnav">
                <ul class="navbar-nav ms-auto fs-5 text-white">
                    <li class="nav-item"><a class="nav-link" href="#home"><i class='bx bxs-home'></i>Home</a></li>
                    <li class="nav-item"><a class="nav-link" href="http://localhost:3000/about.html#about"><i class='bx bxs-user'></i>About</a></li>
                    <li class="nav-item"><a class="nav-link" href="http://localhost:3000/about.html#contact"><i class='bx bxs-envelope'></i>Contact</a></li>
                </ul>
            </div>
        </div>
    </nav>
</header>
''', unsafe_allow_html=True)

# Function to read PDF content
def read_pdf(file):
    pdf_document = fitz.open(stream=file.read(), filetype="pdf")
    text = ""
    for page_num in range(len(pdf_document)):
        page = pdf_document.load_page(page_num)
        text += page.get_text()
    return text

# Function to write content to a file
def write_to_file(file_path, content):
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(content)

# Function to translate text using Google Translate API
def translate_text(text, target_language='ta'):
    translate_client = translate.Client()
    result = translate_client.translate(text, target_language=target_language)
    return result['translatedText']

# Function to summarize text using OpenAI GPT model

def summarize_text(text):
    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": '''You are a document summarizer.. The document alone will be given in the user message. You should follow this rule:

The below mentioned flow describes the format in which the output passage should be
printed.
  ⁠a. The Case Title should be at the top of the output.
⁠  ⁠b. It should mention if it’s a petition or if it’s an appeal
⁠  ⁠c. Next comes the facts about this case which are the evidences, word of
mouth etc.,
⁠  ⁠d. then comes the issues that arise from the evidences and the reality check
⁠  ⁠e. In case of an appeal the judgements or previous hearings on this case is
reviewed. Also you must add the Judgement even though it might be the previous hearings.
⁠f. Next is the Judge’s observations on this case and the Laws applicable for this
case are reviewed over the observations.
⁠g. Then at the end the conclusion or the final judgement of this case is said at
the final point of this passage.
             
Try to avoid characters like * anywhere in the passage

Here is an example summary to be given as response. The response alone should be given with no additional content or explanation.:
Case: Anirudh Kumar Dwivedi and another vs. Principal Judge, Family Court and another


In the case of Anirudh Kumar Dwivedi and another vs. Principal Judge, Family Court and another, the petitioners challenged the order of the Principal Judge, Family Court, Allahabad dated 9.11.2011. The case revolves around a marriage that took place on 7.7.1997 between the petitioners, who later filed for dissolution of marriage due to allegations of cruelty and dowry demands. Concurrently, criminal cases under various sections of the IPC and the Dowry Prohibition Act were initiated.

Following an FIR against petitioner no.1, the case was referred to the Mediation & Conciliation Centre by the High Court, where the parties agreed to a mutual divorce and settled on a permanent alimony of Rs. 3,00,000/- for the wife. This compromise was filed as part of the ongoing divorce petition in the Family Court. Despite this, the Family Court delayed in issuing a decree of divorce, leading the petitioners to file multiple writ petitions under Article 227 of the Constitution, seeking directives for the Family Court to comply with the compromise.

Despite a clear directive from the High Court to finalize the divorce based on the compromise, the Principal Judge, Family Court, persisted in unnecessary procedural delays and inconsistencies, including referring the case to Lok Adalat and requiring an amendment application. Eventually, the Principal Judge used a Supreme Court ruling in Anil Kumar Jain vs. Maya Jain to justify a six-month waiting period post-amendment, disregarding the compromise agreement and prior High Court orders.

The High Court, expressing frustration with the Family Court's actions, reiterated that the mandatory six-month period should be considered from the date the compromise application was filed (17.4.2010), which had already elapsed by the time of its orders on 28.7.2011 and 18.10.2011. The High Court condemned the Principal Judge's disregard for judicial directives and mandated that the Family Court decide the case based on the compromise within one month from the presentation of the certified order. Consequently, the impugned order dated 19.11.2011 was set aside, and the write petition was allowed.

'''},
            {"role": "user", "content": text}
        ],
        max_tokens=1500  # Adjust this based on how detailed you want the summary to be
    )
    return response['choices'][0]['message']['content']

# Function to format Tamil translation based on English summary structure

def formatter(tamil_text, english_text):
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": f'''
You are responsible for formatting content that is given to you. You will be give a Tamil summary and an Englisgh summary as well.
This is the english summary {english_text}
You have to compare both of these texts and bring the tamil translation to the same exact format as the english one. Remeber they both
the same content but in different languages. Remove the * symbol before giving the output.

For Example this is the order in which it should be:
a.first the case would be displayed with the heading வழக்கு:
b.second comes the tamil translation of either Appleal or a Petition as mentioned in the english text and also it should be in a seperate line.
c.The Facts are then printed under the heading உண்மைகள்:
d.The issues are displayed under the heading சிக்கல்கள்: 
e.The hearing or Judgements all must be displayed under the heading தீர்ப்புகள்:
f.All the judges observations are under the heading நீதிபதியின் அவதானிப்புகள்: 
g.All the Laws reviewed are under மறு ஆய்வு செய்யப்பட்ட சட்டங்கள்: 
h.Conclusion is always under the heading முடிவு: 

'''},
            {"role": "user", "content": tamil_text}
        ],
        max_tokens=1500  # Adjust this based on how detailed you want the summary to be
    )
    return response['choices'][0]['message']['content']

 
# Main function to handle the summarizer app
def main():
    st.title("Welcome to Lexmoon Summarizer")
    
    # File uploader for PDFs
    uploaded_file = st.file_uploader("Choose a PDF file", type="pdf")
    submit_button = st.button("Submit")
    
    if uploaded_file is not None and submit_button:
        # Read the PDF file
        pdf_text = read_pdf(uploaded_file)

        # Summarize the PDF
        summarized_content = summarize_text(pdf_text)
        write_to_file('demo.txt', summarized_content)

        # Translate to Tamil
        translated_tamil_text = translate_text(summarized_content)
        tamil_formatted_text = formatter(translated_tamil_text, summarized_content)
        write_to_file('tamiltext.txt', tamil_formatted_text)


        st.markdown(
    r"""
    <style>
    .glass-effect {
        background: rgba(40, 34, 34, 0.742); 
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px); 
        border-radius: 12px; 
        border: 1px solid rgba(255, 255, 255, 0.3); 
        padding: 20px; 
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0);
        margin: 10px;
 
        
    }

    h1 {
        color:#d2a253 ;
    }
    
   
    </style>
    """, unsafe_allow_html=True
)
        # Display the summarized and translated content
        col1, col2 = st.columns(2)
        with col1:
            # st.markdown('<div class="glass-effect">', unsafe_allow_html=True)
            # st.title("English Summary")
            # st.write(summarized_content)
            # st.markdown('</div>', unsafe_allow_html=True)
            st.markdown('<div class="glass-effect"><h1>English Summary</h1></div>', unsafe_allow_html=True)
            st.markdown(f'<div class="glass-effect"><p>{summarized_content}</p></div>', unsafe_allow_html=True)
        with col2:
            # st.markdown('<div class="glass-effect">', unsafe_allow_html=True)
            # st.title("Tamil Summary")
            # st.write(tamil_formatted_text)
            # st.markdown('</div>', unsafe_allow_html=True)
            st.markdown('<div class="glass-effect"><h1>Tamil Summary</h1></div>', unsafe_allow_html=True)
            st.markdown(f'<div class="glass-effect"><p>{tamil_formatted_text}</p></div>', unsafe_allow_html=True)

# Run the main function
if __name__ == "__main__":
    main()

# Hide Streamlit's default "Deploy" button
st.markdown(
    r"""
    <style>
    .stDeployButton {
        visibility: hidden;
    }
    </style>
    """, unsafe_allow_html=True
)

# Function to convert an image to base64 (for background image use)
def get_base64_image(image_path):
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode()

# Load a custom background image (relative path)
moon_img = "D:/githubreptasks/lexmoon-iwinten/public/moon.jpg"
encoded_moon_img = get_base64_image(moon_img)

# Background CSS with rotating moon effect
st.markdown(
    f"""
    <style>
     .stApp {{
        background-color: #000;
        background-attachment: fixed;
    }}
    .moon {{
        z-index: -4;
        top: 300px;
        left: -20px;
        width: 100em;
        height: 90em;
        background: url(data:image/jpg;base64,{encoded_moon_img});
        box-shadow: inset -1.5em -1.5em 1.5em #000, -0.2em -0.2em 0.5em #44392b;
        position: fixed;
        animation: rotate 50s linear infinite;
        border-radius: 50%;
        background-repeat: repeat; 
        background-size: 200% 100%;
    }}
    @keyframes rotate {{
        to {{ background-position: -200% 0; }}
    }}
    </style>
    """,
    unsafe_allow_html=True
)
st.markdown(
    r"""
    <style>
    /* Navbar styles */
    .navbar {
        
        color: white;  
    }
    
    .navbar a {
        color: white;  
    }

    .navbar a:hover {
        color: #d2a253;  
    }

    
    .stFileUploader {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    
    .stFileUploader>div {
        text-align: center;
        font-size: 16px;
        color: #d2a253;
    }

   
    .stButton>button, .stFileUploader>label {
       
        color: black;
        border-radius: 8px;
        border: 1px solid #d2a253;
        padding: 0.5rem 1rem;
        transition: background-color 0.3s ease;
    }
    
    
    .stButton>button:hover, .stFileUploader>label:hover {
        background-color: #d2a253;
        color: white;
    }

   
    .stDeployButton {
        visibility: hidden;
    }

    
   
    .stApp {
        background-color: transparent;
    }
    </style>

    """, unsafe_allow_html=True
)

# Add the rotating moon to the background
st.markdown('<div class="moon"></div>', unsafe_allow_html=True)
