/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import axios from "axios";
import { ethers } from "ethers";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { API } from "../../../backend";
import { PulseLoader } from "react-spinners";
import facebook from "../../../assets/basicIcon/facebook.svg";
import metamask from "../../../assets/basicIcon/metamask.svg";
import { useDispatch } from "react-redux";
import { userLogIn } from "../../../redux/actions/userActions";

const WelcomePopup = ({
  setDefaultPopup,
  setShowLoginPopup,
  setShowCreateUserPopup,
  setLoginEmail,
  setWalletSignature,
}) => {
  const [inputFocused, setInputFocused] = useState(false);
  const { handleSubmit, register, reset } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const dispatch = useDispatch();

  const handleInputFocus = () => {
    setInputFocused(true);
  };

  const handleInputBlur = () => {
    setInputFocused(false);
  };

  const handleCheckEmail = async (data) => {
    const email = data.email;
    setLoginEmail(email);
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API}auth/check_email`,
        {
          email: email,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const responseData = response?.data;
      if (responseData?.success === 1) {
        setDefaultPopup(false);
        setShowLoginPopup(true);
      }
      if (responseData?.success === 0) {
        setDefaultPopup(false);
        setShowCreateUserPopup(true);
      }
      setTimeout(() => {
        reset();
      }, 300);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    // Loading the Facebook SDK asynchronously
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: "1025897438850966",
        cookie: true,
        xfbml: true,
        version: "v13.0",
      });

      // Check login status
      window.FB.getLoginStatus(function (response) {
        if (response.status === "connected") {
          // User is logged in and authenticated
          setIsLoggedIn(true);
        } else {
          // User is not logged in or not authenticated
          // Prompt the user to log in with Facebook
          window.FB.login(function (response) {
            if (response.authResponse) {
              // User successfully logged in and authenticated
              setIsLoggedIn(true);
            } else {
              // User canceled the login or didn't authorize the app
              setIsLoggedIn(false);
            }
          });
        }
      });
    };

    // Load the Facebook SDK script
    (function (d, s, id) {
      var js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src =
        "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v13.0&appId=1025897438850966&autoLogAppEvents=1";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  };

  const handleMetaMaskConnect = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const message = "Sign this message to authenticate";
        const signature = await signer.signMessage(message);
        setWalletSignature(signature);

        const response = await axios.post(
          `${API}auth/check_walletAddress`,
          {
            signature: signature,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const responseData = response?.data;
        if (responseData?.success === 1) {
          setDefaultPopup(false);
          const response = await axios.post(`${API}auth/log_in_metamask`, {
            signature: signature,
          });
          const userData = response.data;
          if (userData?.success === 0) {
            alert("Error");
          } else if (userData?.success === 1) {
            dispatch(userLogIn(userData));
            let accessToken = localStorage.getItem("accessToken");
            let refreshToken = localStorage.getItem("refreshToken");

            if (!accessToken) {
              localStorage.setItem(
                "accessToken",
                JSON.stringify(userData?.accessToken)
              );
            } else if (accessToken) {
              accessToken = userData?.accessToken;
              localStorage.setItem("accessToken", JSON.stringify(accessToken));
            }
            if (!refreshToken) {
              localStorage.setItem(
                "refreshToken",
                JSON.stringify(userData?.refreshToken)
              );
            } else if (refreshToken) {
              refreshToken = userData?.refreshToken;
              // // console.log(refreshToken);
              localStorage.setItem(
                "refreshToken",
                JSON.stringify(refreshToken)
              );
            }
            window.location.reload();
            setShowLoginPopup(false);
            setDefaultPopup(true);
          }
        }
        if (responseData?.success === 0) {
          setDefaultPopup(false);
          setShowCreateUserPopup(true);
        }
        setTimeout(() => {
          reset();
        }, 300);
      } catch (error) {
        console.error("MetaMask connection error:", error);
      }
    } else {
      alert("MetaMask is not installed");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* welcome option */}
      <div className="px-8 pt-4">
        <h2 className="font-medium text-[22px] text-[#222222]">
          Welcome to Motel
        </h2>
        <form onSubmit={handleSubmit(handleCheckEmail)}>
          <input
            type="email"
            placeholder="Email"
            className={`w-full border-[1.5px] border-[#dddddd] p-3 rounded-lg mt-4 ${
              inputFocused ? "placeholder-shrink" : "placeholder-restore"
            }`}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            {...register("email", {
              required: true,
              onBlur: handleInputBlur,
            })}
          />
          <div className=" pt-4 px-8 italic">
            <ul className=" list-disc text-xs text-[#222222] opacity-80">
              <p>You can use below test credentials to login!</p>
              <li>email: guest@email.com</li>
            </ul>
          </div>
          <p className=" text-xs text-[#222222] pt-3 mb-5 opacity-80 ml-[2px]">
            We’ll send a confirmation email to verify your email address. <br />{" "}
            <Link className=" font-semibold underline">Privacy Policy</Link>
          </p>
          <button
            className={`bg-[#ff385c] hover:bg-[#d90b63] transition-all duration-300 text-white font-medium rounded-lg p-3 w-full disabled:bg-[#dddddd] ${
              isLoading ? " cursor-not-allowed" : ""
            }`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <PulseLoader
                color="#f7f7f7"
                size={7}
                margin={4}
                speedMultiplier={0.6}
              />
            ) : (
              "Continue"
            )}
          </button>
        </form>
      </div>
      {/* devider */}
      <div className="flex flex-row items-center px-8">
        <div className="h-[1.2px] w-full inline-block bg-[#dddddd]"></div>
        <p className="inline-block text-xs mx-2">or</p>
        <div className="h-[1.2px] w-full inline-block bg-[#dddddd]"></div>
      </div>
      {/* continue with google/facebook */}
      <div className=" flex flex-col gap-4 px-8 pb-7">
        <div
          className=" w-full flex flex-row items-center border border-[#222222] rounded-lg py-[10px] bg-[#ffffff] hover:bg-[#f7f7f7] transition-colors cursor-pointer"
          onClick={handleFacebookLogin}
        >
          <img src={facebook} alt="Log in with facebook" className="w-6 ml-5" />
          <p className="text-sm mx-auto font-medium text-[#222222]">
            Continue with Facebook
          </p>
        </div>
        <div
          className=" w-full flex flex-row items-center border border-[#222222] rounded-lg py-[10px] bg-[#ffffff] hover:bg-[#f7f7f7] transition-colors cursor-pointer"
          onClick={handleMetaMaskConnect}
        >
          <img src={metamask} alt="Log in with metamask" className="w-6 ml-5" />
          <p className="text-sm mx-auto font-medium text-[#222222]">
            Continue with MetaMask
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
